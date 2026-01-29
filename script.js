let langChartInstance = null;

function switchTab(tab) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tab + '-sec').classList.add('active');
    event.target.classList.add('active');
}

async function performFullAnalysis() {
    const user = document.getElementById('targetUser').value;
    if (!user) return;

    try {
        // Fetch Primary Data
        const userRes = await fetch(`https://api.github.com/users/${user}`);
        const userData = await userRes.json();
        
        // Fetch Repos (for stars & languages)
        const repoRes = await fetch(`https://api.github.com/users/${user}/repos?per_page=100`);
        const repos = await repoRes.json();

        // Fetch Recent Events (Actions)
        const eventRes = await fetch(`https://api.github.com/users/${user}/events/public?per_page=5`);
        const events = await eventRes.json();

        if (userData.message === "Not Found") return alert("User not found!");

        displayAnalysis(userData, repos, events);
    } catch (e) {
        alert("API Error or Rate Limit Reached");
    }
}

function displayAnalysis(user, repos, events) {
    document.getElementById('report-card').style.display = 'block';
    
    // Header Info
    document.getElementById('avatar').src = user.avatar_url;
    document.getElementById('fullName').innerText = user.name || user.login;
    document.getElementById('bio').innerText = user.bio || "No bio set.";
    
    // Stats Calculation
    const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
    document.getElementById('stat-followers').innerText = user.followers;
    document.getElementById('stat-stars').innerText = totalStars;
    document.getElementById('stat-repos').innerText = user.public_repos;
    document.getElementById('stat-year').innerText = new Date(user.created_at).getFullYear();

    // Language Chart Logic
    const langMap = {};
    repos.forEach(r => {
        if(r.language) langMap[r.language] = (langMap[r.language] || 0) + 1;
    });
    updateChart(langMap);

    // Actions List
    const list = document.getElementById('activity-list');
    list.innerHTML = events.map(e => `<li><i class="fas fa-check-circle"></i> ${e.type.replace('Event','')} in ${e.repo.name}</li>`).join('');

    // GitHub Readme Stats (Dynamic Image)
    document.getElementById('streak-img').src = `https://github-readme-stats.vercel.app/api?username=${user.login}&show_icons=true&theme=tokyonight&bg_color=0D111700`;
}

function updateChart(data) {
    const ctx = document.getElementById('langChart').getContext('2d');
    if (langChartInstance) langChartInstance.destroy();
    
    langChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: ['#00d2ff', '#9d50bb', '#ff4b2b', '#f9d423', '#43e97b'],
                borderWidth: 0
            }]
        },
        options: { plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } } }
    });
}

function saveReport() {
    html2canvas(document.getElementById('report-card'), { 
        backgroundColor: "#05070a",
        useCORS: true 
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'GitPro-Report.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

async function startComparison() {
    const u1 = document.getElementById('user1').value;
    const u2 = document.getElementById('user2').value;
    if(!u1 || !u2) return alert("Enter two usernames");

    const data1 = await fetch(`https://api.github.com/users/${u1}`).then(r => r.json());
    const data2 = await fetch(`https://api.github.com/users/${u2}`).then(r => r.json());

    document.getElementById('compare-output').innerHTML = `
        <div class="glass card">${renderCompare(data1)}</div>
        <div class="glass card">${renderCompare(data2)}</div>
    `;
}

function renderCompare(d) {
    return `
        <img src="${d.avatar_url}" style="width:80px; border-radius:50%">
        <h3>${d.name || d.login}</h3>
        <p>Followers: ${d.followers}</p>
        <p>Public Repos: ${d.public_repos}</p>
        <p>Account Value: $${(d.followers * 1.5 + d.public_repos * 2).toFixed(2)}</p>
    `;
}