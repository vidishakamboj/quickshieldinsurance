function handleLogin() {
    const name = document.getElementById("userName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const platform = document.getElementById("platform").value;

    if (!name || !phone) {
        alert("Please enter both name and phone number");
        return;
    }
    if (!platform) {
        alert("Please select a platform");
        return;
    }

    // Save to localStorage
    localStorage.setItem("userName", name);
    localStorage.setItem("phone", phone);
    localStorage.setItem("platform", platform);

    // Redirect to plans page
    window.location.href = "plans.html";
}

// BUY PLAN
async function buyPlan(planType){
    const userId = localStorage.getItem("userId");
    if(!userId){ alert("Login first"); window.location.href="index.html"; return; }

    try{
        const res = await fetch("http://localhost:5000/buy-plan",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({userId,planType})
        });
        const data = await res.json();
        if(data.success){
            localStorage.setItem("plan",planType);
            alert("Plan purchased: "+planType);
            window.location.href="dashboard.html";
        } else alert("Plan purchase failed");
    } catch(err){ console.error(err); alert("Server error"); }
}

// DASHBOARD CLAIM
async function triggerClaim(claimType="Accident"){
    const userId = localStorage.getItem("userId");
    const plan = localStorage.getItem("plan");
    const device = navigator.userAgent;
    if(!userId || !plan){ alert("Buy a plan first"); return; }

    let lat=0, lon=0, speed=0;
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
            (pos)=>sendClaim(userId,plan,device,pos.coords.latitude,pos.coords.longitude,pos.coords.speed||0,claimType),
            ()=>sendClaim(userId,plan,device,lat,lon,speed,claimType)
        );
    } else sendClaim(userId,plan,device,lat,lon,speed,claimType);
}

async function sendClaim(userId,plan,device,lat,lon,speed,claimType){
    try{
        const res = await fetch("http://localhost:5000/claim",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({userId,speed,lat,lon,browser:device,claimType})
        });
        const data = await res.json();
        document.getElementById("result").innerHTML = `Status: ${data.status}<br>Reason: ${data.reason}<br>Payout: ₹${data.payout}`;
    } catch(err){ console.error(err); alert("Server error"); }
}
async function fileClaim() {
    const btn = document.getElementById('submitBtn');
    const userId = localStorage.getItem('userId');

    // Read values from form
    const claimType = document.getElementById('claimType').value;
    const speed = parseFloat(document.getElementById('speed').value) || 0;
    const lat = parseFloat(document.getElementById('lat').value) || 0;
    const lon = parseFloat(document.getElementById('lon').value) || 0;
    const browser = navigator.userAgent;

    if (!claimType) { alert("Select Nature of Incident"); return; }
    if (speed < 0) { alert("Enter valid speed"); return; }

    btn.disabled = true;
    btn.innerText = "Processing...";

    const claimData = { userId, claimType, speed, lat, lon, browser };

    try {
        const response = await fetch('http://localhost:5000/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(claimData)
        });

        const result = await response.json();

        if (result.status === "Suspicious") {
            alert(`⚠️ ALERT: Claim flagged as SUSPICIOUS.\nReason: ${result.reason}`);
        } else {
            alert(`✅ Claim Submitted Successfully!\nStatus: ${result.status}\nEstimated Payout: ₹${result.payout}`);
        }

        window.location.href = 'status.html';

    } catch (error) {
        console.error("Error submitting claim:", error);
        alert("Server error. Make sure Node.js server is running on port 5000.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Submit Insurance Claim";
    }
}
async function loadClaims() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Login first!");
        window.location.href = "index.html";
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/admin/claims");
        const allClaims = await res.json();

        // Filter only current user's claims
        const userClaims = allClaims.filter(c => c.userId === userId);

        const tbody = document.querySelector("#claimsTable tbody");
        tbody.innerHTML = ""; // Clear previous

        if (userClaims.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No claims submitted yet</td></tr>`;
            return;
        }

        userClaims.forEach(claim => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${claim.id}</td>
                <td>${claim.plan}</td>
                <td>${claim.claimType}</td>
                <td>${claim.status}</td>
                <td>${claim.reason}</td>
                <td>₹${claim.payout}</td>
                <td>${claim.date}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        alert("Error loading claims. Make sure server is running on port 5000.");
    }
}

// Call on page load
window.onload = loadClaims;

function goDashboard() {
    window.location.href = "dashboard.html";
}
