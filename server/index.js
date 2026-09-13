import express from 'express'; import cors from 'cors';
const app=express(); app.use(cors()); app.use(express.json());
const attendance=[
{student:'Akhil Raj',rollNo:'MCA001',course:'MCA',semester:1,section:'A',date:'2026-09-01',subject:'Data Structures',faculty:'Dr. Smith',period:1,status:'Present'},
{student:'Akhil Raj',rollNo:'MCA001',course:'MCA',semester:1,section:'A',date:'2026-09-01',subject:'Advanced DBMS',faculty:'Dr. Ramesh',period:2,status:'Present'},
{student:'Akhil Raj',rollNo:'MCA001',course:'MCA',semester:1,section:'A',date:'2026-09-01',subject:'Web Technologies',faculty:'Ms. Anjali',period:3,status:'Absent'},
{student:'Akhil Raj',rollNo:'MCA001',course:'MCA',semester:1,section:'A',date:'2026-09-01',subject:'Discrete Mathematics',faculty:'Dr. Kumar',period:4,status:'Present'},
{student:'Akhil Raj',rollNo:'MCA001',course:'MCA',semester:1,section:'A',date:'2026-09-02',subject:'Data Structures',faculty:'Dr. Smith',period:1,status:'Present'},
{student:'Akhil Raj',rollNo:'MCA001',course:'MCA',semester:1,section:'A',date:'2026-09-02',subject:'Advanced DBMS',faculty:'Dr. Ramesh',period:2,status:'Present'},
{student:'Arjun Kumar',rollNo:'MCA002',course:'MCA',semester:1,section:'A',date:'2026-09-03',subject:'Algorithms',faculty:'Dr. Meera',period:1,status:'Present'},
{student:'Arjun Kumar',rollNo:'MCA002',course:'MCA',semester:1,section:'A',date:'2026-09-03',subject:'Web Technologies',faculty:'Ms. Anjali',period:3,status:'Present'}];
app.get('/api/health',(req,res)=>res.json({ok:true})); app.get('/api/attendance',(req,res)=>res.json(attendance)); app.get('/api/academic/teaching-assignments',(req,res)=>res.json([])); app.post('/api/academic/teaching-assignments',(req,res)=>res.status(201).json({...req.body,_id:Date.now().toString()}));
app.use((req,res)=>res.status(404).json({message:'API route not found'})); app.listen(5000,()=>console.log('OCMS API running on http://localhost:5000'));
