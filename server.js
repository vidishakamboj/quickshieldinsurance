const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage
let users = [];          
let claims = [];         
let activePlans = {};    
let loginAttempts = {};

// Weather check
const isWeatherClear = async (lat, lon) => {
    try {
        const res = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        return res.data.current_weather.weathercode === 0;
    } catch (e) {
        return false;
    }
};

// LOGIN
app.post('/login', (req, res) => {
    const { userId, platform, device, lat, lon, speed } = req.body;

    if (!loginAttempts[userId]) loginAttempts[userId] = 0;
    loginAttempts[userId]++;

    let status = 'Safe Login';
    let reason = [];

    if (!device.includes('Chrome')) reason.push('Untrusted Device');
    if (lat === 0 && lon === 0) reason.push('Fake GPS');
    if (speed > 100) reason.push('High Speed');
    if (loginAttempts[userId] > 3) reason.push('Multiple Attempts');

    if (reason.length > 0) status = reason.includes('Fake GPS') || loginAttempts[userId] > 3 ? 'Fraud Detected' : 'Suspicious Login';

    let user = users.find(u => u.userId === userId);
    if (!user) {
        user = { userId, platform, plan: null, status, reason };
        users.push(user);
    } else {
        user.status = status;
        user.reason = reason;
    }

    res.json({ success: true, user });
});

// BUY PLAN
app.post('/buy-plan', (req,res)=>{
    const { userId, planType } = req.body;
    if(!userId || !planType) return res.status(400).json({success:false,message:"Missing data"});

    activePlans[userId] = planType;

    let user = users.find(u=>u.userId===userId);
    if(user) user.plan = planType;

    res.json({ success:true, plan: planType });
});

// CLAIM
app.post('/claim', async (req,res)=>{
    const { userId, speed=0, lat=0, lon=0, browser='', claimType } = req.body;

    if(!activePlans[userId]) return res.json({status:"Rejected", reason:"No active plan", payout:0});

    let status="Approved", reason="Valid Claim", payout=500;

    if(speed>100) { status="Suspicious"; reason="High Speed"; payout=0; }
    else if(lat===0 && lon===0) { status="Suspicious"; reason="Invalid GPS"; payout=0; }
    else if(!browser.includes('Chrome')) { status="Suspicious"; reason="Untrusted Device"; payout=0; }
    else if(claimType==="Weather Damage"){
        const clear = await isWeatherClear(lat,lon);
        if(clear){ status="Suspicious"; reason="Clear Weather Reported"; payout=0; }
    }

    const claim = { id: claims.length+1, userId, plan: activePlans[userId], status, reason, payout, claimType, date:new Date().toLocaleString() };
    claims.push(claim);

    res.json(claim);
});

// ADMIN
app.get('/admin/claims',(req,res)=>res.json(claims));
app.get('/admin/users',(req,res)=>res.json(users));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.patch('/admin/update-claim',(req,res)=>{
    const { id, status } = req.body;
    const claim = claims.find(c=>c.id===id);
    if(claim) claim.status=status;
    res.json({success:true});
});

// SERVER
app.listen(5000,()=>console.log("Server running on http://localhost:5000"));