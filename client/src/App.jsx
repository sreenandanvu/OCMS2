import React,{useState} from 'react';
import Shell from './components/Shell';
import AdminPage from './admin/AdminPage';
import FacultyPage from './faculty/FacultyPage';
import StudentPage from './student/StudentPage';

const users={
  admin:{name:'OCMS Administrator',email:'admin@ocms.com',password:'admin123',role:'admin',label:'Administrator',icon:'🛡️'},
  faculty:{name:'Anjali Faculty',email:'anjali@ocms.com',password:'faculty123',role:'faculty',label:'Faculty',icon:'👨‍🏫'},
  student:{name:'Akhil Raj',email:'akhil@ocms.com',password:'student123',role:'student',label:'Student',icon:'🎓'}
};

export default function App(){
  const[signed,setSigned]=useState(()=>JSON.parse(localStorage.getItem('ocms_user')||'null'));
  const[page,setPage]=useState('dashboard');
  if(!signed)return <Login onLogin={u=>{localStorage.setItem('ocms_user',JSON.stringify(u));setSigned(u)}}/>;
  return <Shell user={signed} page={page} onNavigate={setPage}>{signed.role==='admin'?<AdminPage page={page}/>:signed.role==='faculty'?<FacultyPage page={page}/>:<StudentPage page={page}/>}</Shell>;
}

function Login({onLogin}){
  const[selected,setSelected]=useState('admin');
  const[email,setEmail]=useState(users.admin.email);
  const[password,setPassword]=useState(users.admin.password);
  const[error,setError]=useState('');

  function selectRole(role){
    setSelected(role);setEmail(users[role].email);setPassword(users[role].password);setError('');
  }
  function submit(e){
    e.preventDefault();
    const u=Object.values(users).find(x=>x.email===email&&x.password===password);
    if(u)onLogin(u);else setError('Invalid email or password');
  }

  return <div className="login-page">
    <div className="login-brand"><div className="logo"><span>O</span>CMS</div><p>Online College Management System</p></div>
    <div className="login-card login-card-wide">
      <div className="login-heading"><h1>Welcome back</h1><p>Choose your account type to continue</p></div>
      <div className="role-login-grid">
        {Object.entries(users).map(([role,u])=><button type="button" key={role} className={selected===role?'role-login active':'role-login'} onClick={()=>selectRole(role)}>
          <span className="role-icon">{u.icon}</span><span><b>{u.label}</b><small>Login as {u.label.toLowerCase()}</small></span>
        </button>)}
      </div>
      <form onSubmit={submit}>
        <label>Email address</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email"/>
        <label>Password</label><input value={password} onChange={e=>setPassword(e.target.value)} onChangeCapture={()=>setError('')} placeholder="Password" type="password"/>
        {error&&<div className="error">{error}</div>}
        <button className="primary login-submit">Sign in as {users[selected].label}</button>
      </form>
      <div className="demo-credentials"><b>Demo accounts</b><span>Admin: admin@ocms.com / admin123</span><span>Faculty: anjali@ocms.com / faculty123</span><span>Student: akhil@ocms.com / student123</span></div>
    </div>
  </div>;
}
