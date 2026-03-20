const API = "http://localhost:3000";

async function loadAdminData() {
    const res = await fetch(`${API}/admin/claims`);
    const claims = await res.json();
    const table = document.getElementById('adminClaimsTable');
    if(table) {
        table.innerHTML = claims.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.userId}</td>
                <td>${c.reason}</td>
                <td class="${c.status}">${c.status}</td>
                <td>
                    <button onclick="updateStatus(${c.id}, 'Approved')" style="width:auto; padding:5px; background:green;">Approve</button>
                    <button onclick="updateStatus(${c.id}, 'Rejected')" style="width:auto; padding:5px; background:red;">Reject</button>
                </td>            </tr>
        `).join('');
    }
}

async function updateStatus(id, status) {    await fetch(`${API}/admin/update-claim`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id, status })
    });
    loadAdminData();
}

if(window.location.pathname.includes('analytics.html')) {
    fetch(`${API}/admin/analytics`).then(res => res.json()).then(s => {
        document.getElementById('stats').innerHTML = `
            <div class="card">Total Claims: ${s.total}</div>
            <div class="card" style="color:green">Approved: ${s.approved}</div>
            <div class="card" style="color:orange">Suspicious: ${s.suspicious}</div>
            <div class="card" style="color:red">Rejected: ${s.rejected}</div>
        `;    });
}

loadAdminData();