import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Users, UserPlus, Gamepad2, Bookmark, Plus, LogIn, LogOut, ChevronRight, X, Check, Shield, Clock3, Mic, Pencil, UserCheck, UserRound, Trash2 } from 'lucide-react';
import { supabase, isConfigured } from './supabase';
import './styles.css';

const DEMO_GAMES = [
  {id:'730', name:'Counter-Strike 2', players:'1.4M', modes:['Premier','Competitive','Wingman','Casual']},
  {id:'570', name:'Dota 2', players:'700K', modes:['Ranked All Pick','Turbo','Ability Draft']},
  {id:'1172470', name:'Apex Legends', players:'350K', modes:['Ranked','Trios','Duos','Mixtape']},
  {id:'578080', name:'PUBG: BATTLEGROUNDS', players:'600K', modes:['Squads','Duos','Solo','Ranked']},
  {id:'1938090', name:'Call of Duty', players:'250K', modes:['Resurgence','Battle Royale','Multiplayer','Zombies']},
  {id:'1599340', name:'Lost Ark', players:'180K', modes:['Raid','Chaos Dungeon','Abyssal Dungeon']},
  {id:'1085660', name:'Destiny 2', players:'150K', modes:['Trials','Crucible','Nightfall','Raid']},
  {id:'252490', name:'Rust', players:'140K', modes:['Vanilla','Modded','Duo','Trio']}
];
const INITIAL_USERS = [
  {id:'u1',name:'RogueMango',tag:'@roguemango',games:['Counter-Strike 2','Apex Legends'],status:'Looking for 2',online:true},
  {id:'u2',name:'NovaByte',tag:'@novabyte',games:['Destiny 2','PUBG: BATTLEGROUNDS'],status:'Online',online:true},
  {id:'u3',name:'KiteRunner',tag:'@kiterunner',games:['Counter-Strike 2','Dota 2'],status:'Looking for 1',online:false},
  {id:'u4',name:'Mira',tag:'@mira',games:['Apex Legends','Call of Duty'],status:'Online',online:true},
  {id:'u5',name:'PixelForge',tag:'@pixelforge',games:['Rust','Counter-Strike 2'],status:'Looking for 3',online:true},
  {id:'u6',name:'Orbit',tag:'@orbit',games:['Destiny 2','Apex Legends'],status:'Looking for 1',online:false}
];
const INITIAL_LFG = [
  {id:1,user:'RogueMango',game:'Counter-Strike 2',mode:'Premier',need:2,text:'Looking for chill players. Voice preferred, no rage.',voice:true},
  {id:2,user:'NovaByte',game:'Destiny 2',mode:'Nightfall',need:1,text:'Running Grandmaster. Experienced players welcome.',voice:true},
  {id:3,user:'KiteRunner',game:'Dota 2',mode:'Ranked All Pick',need:1,text:'Party queue, mic on. Looking for support.',voice:true},
  {id:4,user:'Mira',game:'Apex Legends',mode:'Ranked',need:2,text:'Diamond push. Looking for consistent teammates.',voice:true},
  {id:5,user:'PixelForge',game:'Rust',mode:'Trio',need:2,text:'Fresh wipe tonight. Building a regular group.',voice:false}
];
const INITIAL_SQUADS = [
  {id:'s1',name:'Late Night CS',game:'Counter-Strike 2',mode:'Premier',members:4,max:5,saved:true},
  {id:'s2',name:'Friday Raiders',game:'Destiny 2',mode:'Raid',members:5,max:6,saved:true},
  {id:'s3',name:'Apex Friends',game:'Apex Legends',mode:'Ranked',members:3,max:3,saved:true}
];

function App(){
  const [tab,setTab]=useState('discover');
  const [query,setQuery]=useState('');
  const [game,setGame]=useState('All games');
  const [mode,setMode]=useState('All modes');
  const [showLogin,setShowLogin]=useState(false);
  const [showLfg,setShowLfg]=useState(false);
  const [showProfileEdit,setShowProfileEdit]=useState(false);
  const [session,setSession]=useState(null);
  const [toast,setToast]=useState('');
  const [users,setUsers]=useState(INITIAL_USERS);
  const [lfg,setLfg]=useState(INITIAL_LFG);
  const [squads,setSquads]=useState(INITIAL_SQUADS);
  const [profile,setProfile]=useState(null);

  useEffect(() => {
  if (!supabase) return;

  let mounted = true;

  async function loadProfile(userId) {
    if (!userId) {
      if (mounted) setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to load profile:', error);
      if (mounted) setProfile(null);
      return;
    }

    if (mounted) {
      setProfile(data);
    }
  }

  async function initializeAuth() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Failed to get session:', error);
      return;
    }

    if (!mounted) return;

    setSession(data.session);

    if (data.session?.user) {
      await loadProfile(data.session.user.id);
    }
  }

  initializeAuth();

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
    if (!mounted) return;

    setSession(newSession);

    if (newSession?.user) {
      await loadProfile(newSession.user.id);
    } else {
      setProfile(null);
    }
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);
  useEffect(()=>{ if(toast){const t=setTimeout(()=>setToast(''),2800);return()=>clearTimeout(t)}},[toast]);

  const selectedGame=DEMO_GAMES.find(g=>g.name===game);
  const modes=selectedGame?.modes || [];
  const filteredUsers=useMemo(()=>users.filter(u=>{
    const text=(u.name+' '+u.tag+' '+u.games.join(' ')).toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (game==='All games'||u.games.includes(game));
  }),[query,game,users]);
  const posts=useMemo(()=>lfg.filter(p=>(game==='All games'||p.game===game)&&(mode==='All modes'||p.mode===mode)),[lfg,game,mode]);

  function navigate(next){setTab(next); if(next!=='discover') window.scrollTo({top:0,behavior:'smooth'});}
  function selectGame(name){setGame(name);setMode('All modes');navigate('lfg');}
  async function logout(){if(supabase) await supabase.auth.signOut();setSession(null);setToast('Signed out');}
  function sendFriend(name){setToast(`Friend request sent to ${name}`);}
async function saveProfile(next) {
  if (!supabase || !session?.user) {
    setToast('You must be signed in to update your profile.');
    return;
  }

  const updates = {
    display_name: next.display_name?.trim() || '',
    username: next.username?.trim().toLowerCase() || '',
    bio: next.bio?.trim() || '',
    timezone: next.timezone?.trim() || ''
  };

  if (!updates.display_name || !updates.username) {
    setToast('Display name and username are required.');
    return;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', session.user.id)
    .select()
    .single();

  if (error) {
    console.error('Profile update failed:', error);

    if (error.code === '23505') {
      setToast('That username is already taken.');
    } else {
      setToast(error.message);
    }

    return;
  }

  setProfile(data);
  setShowProfileEdit(false);
  setToast('Profile updated');
}
  function createLfg(post) {
  setLfg(v => [
    {
      ...post,
      id: Date.now(),
      user: profile?.display_name || profile?.displayName || 'Demo Player'
    },
    ...v
  ]);

  setShowLfg(false);
  setToast('LFG post created');
}
  function toggleSave(id){setSquads(v=>v.map(s=>s.id===id?{...s,saved:!s.saved}:s));setToast('Saved squad updated');}

  return <div className="app">
    <header className="topbar">
      <div className="brand" onClick={()=>navigate('discover')}><div className="brandMark">S</div><div>SquadUp<span>.GG</span></div></div>
      <nav>{[['discover','Discover'],['lfg','LFG'],['squads','My Squads'],['friends','Players']].map(([id,label])=><button key={id} className={tab===id?'nav active':'nav'} onClick={()=>navigate(id)}>{label}</button>)}</nav>
      <div className="topActions"><button className="iconButton" onClick={()=>document.querySelector('.searchBox input')?.focus()}><Search size={18}/></button>{session ? (
  <button className="profilePill" onClick={() => navigate('profile')}>
    <span className="avatar">
      {(profile?.display_name || profile?.displayName || 'P')[0].toUpperCase()}
    </span>
    {profile?.display_name || profile?.displayName || 'Loading...'}
  </button>
) : (
  <button className="loginButton" onClick={() => setShowLogin(true)}>
    <LogIn size={17}/> Log in
  </button>
)}</div>
    </header>

    <main>
      <section className="hero">
        <div><div className="eyebrow">FIND YOUR PEOPLE</div><h1>Stop solo queuing.</h1><p>Find players who match your games, modes, schedule, and vibe.</p><div className="heroCtas"><button className="primaryButton" onClick={()=>navigate('lfg')}><Users size={16}/> Find a squad</button><button className="outlineButton heroOutline" onClick={()=>setShowLfg(true)}><Plus size={16}/> Post LFG</button></div></div>
        <div className="heroStats"><div><b>{DEMO_GAMES.length}</b><span>Popular games</span></div><div><b>{lfg.length}</b><span>Active LFG posts</span></div><div><b>∞</b><span>Squads to build</span></div></div>
      </section>

      {(tab==='discover'||tab==='friends'||tab==='squads'||tab==='lfg') && <div className="filters">
        <div className="searchBox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search players, games, or tags..."/></div>
        <select value={game} onChange={e=>{setGame(e.target.value);setMode('All modes')}}><option>All games</option>{DEMO_GAMES.map(g=><option key={g.id}>{g.name}</option>)}</select>
        <select value={mode} onChange={e=>setMode(e.target.value)} disabled={!selectedGame}><option>All modes</option>{modes.map(m=><option key={m}>{m}</option>)}</select>
      </div>}

      {tab==='discover' && <div className="gridLayout"><section><SectionTitle title="Players looking for a squad" action="View all" onClick={()=>navigate('friends')}/><div className="userGrid">{filteredUsers.slice(0,4).map(u=><PlayerCard key={u.id} u={u} onToast={sendFriend}/>)}</div></section><aside><SectionTitle title="Popular on Steam" action="See LFG" onClick={()=>navigate('lfg')}/><div className="gameList">{DEMO_GAMES.slice(0,6).map((g,i)=><GameRow key={g.id} g={g} rank={i+1} onClick={()=>selectGame(g.name)}/>)}</div></aside></div>}
      {tab==='lfg' && <section><SectionTitle title={game==='All games'?'All LFG posts':game} action="Create LFG" onClick={()=>setShowLfg(true)}/><div className="lfgList">{posts.map(p=><LfgCard key={p.id} p={p} onToast={setToast}/>)}{!posts.length&&<Empty text="No LFG posts match those filters yet."/>}</div></section>}
      {tab==='friends' && <section><SectionTitle title="Find players" action="Clear filters" onClick={()=>{setQuery('');setGame('All games');setMode('All modes')}}/><div className="resultsMeta">{filteredUsers.length} players match your search</div><div className="userGrid">{filteredUsers.map(u=><PlayerCard key={u.id} u={u} onToast={sendFriend}/>)}</div></section>}
      {tab==='squads' && <Squads squads={squads} onSave={toggleSave} onToast={setToast}/>} 
      {tab==='profile' && <Profile profile={profile} session={session} onLogout={logout} onEdit={()=>setShowProfileEdit(true)}/>} 
    </main>
    <footer><span>SquadUp.GG</span><span>Built for finding your next squad.</span><span className="tech">Steam-ready • Supabase-ready</span></footer>
    {showLogin&&<LoginModal close={()=>setShowLogin(false)} onToast={setToast} onSession={s=>{setSession(s);setShowLogin(false)}}/>}
    {showLfg&&<LfgModal close={()=>setShowLfg(false)} games={DEMO_GAMES} defaultGame={game==='All games'?'':game} onCreate={createLfg}/>} 
    {showProfileEdit&&<ProfileModal profile={profile} close={()=>setShowProfileEdit(false)} onSave={saveProfile}/>} 
    {toast&&<div className="toast"><Check size={17}/>{toast}</div>}
  </div>
}

function SectionTitle({title,action,onClick}){return <div className="sectionTitle"><h2>{title}</h2>{action&&<button onClick={onClick}>{action}<ChevronRight size={15}/></button>}</div>}
function PlayerCard({u,onToast}){return <article className="card playerCard"><div className="cardTop"><div className="avatar large">{u.name[0]}</div><span className={u.online?'onlineDot':'offlineDot'}></span><div className="playerIdentity"><h3>{u.name}</h3><small>{u.tag}</small></div></div><div className="status">{u.status}</div><div className="chips">{u.games.map(g=><span key={g}>{g}</span>)}</div><button className="outlineButton" onClick={()=>onToast(u.name)}><UserPlus size={15}/> Add friend</button></article>}
function GameRow({g,rank,onClick}){return <button className="gameRow" onClick={onClick}><span className="rank">{String(rank).padStart(2,'0')}</span><div className="gameIcon">{g.name[0]}</div><div className="gameInfo"><b>{g.name}</b><small>{g.players} current players</small></div><ChevronRight size={17}/></button>}
function LfgCard({p,onToast}){return <article className="card lfgCard"><div className="lfgHeader"><div className="avatar">{p.user[0]}</div><div><b>{p.user}</b><small>{p.game} · {p.mode}</small></div><span className="need"><Users size={14}/> {p.need} needed</span></div><p>{p.text}</p><div className="lfgMeta">{p.voice&&<span><Mic size={13}/> Voice required</span>}<span><Clock3 size={13}/> Active now</span></div><button className="joinButton" onClick={()=>onToast(`Join request sent for ${p.game} — ${p.mode}`)}>Request to join</button></article>}
function Squads({squads,onSave,onToast}){return <section><SectionTitle title="Saved squads" action="New squad" onClick={()=>onToast('Squad creation is next — membership schema is ready.')}/><div className="squadGrid">{squads.map(s=><article className="card squadCard" key={s.id}><div className="squadTop"><div className="squadBadge"><Users/></div><button className="saveButton" onClick={()=>onSave(s.id)} aria-label="Save squad"><Bookmark size={16} fill={s.saved?'currentColor':'none'}/></button></div><h3>{s.name}</h3><p>{s.game} · {s.mode}</p><div className="memberBar"><span style={{width:`${Math.min(100,(s.members/s.max)*100)}%`}}/></div><div className="squadBottom"><span>{s.members}/{s.max} members</span><button onClick={()=>onToast(`Opened ${s.name}`)}>Open</button></div></article>)}</div></section>}
function Profile({ profile, session, onLogout, onEdit }) {
  if (!session) {
    return (
      <section className="profilePage">
        <div className="card">
          <h2>You aren't signed in</h2>
          <p className="muted">
            Log in to view your SquadUp profile.
          </p>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="profilePage">
        <div className="card">
          <h2>Loading profile...</h2>
          <p className="muted">
            Getting your SquadUp profile.
          </p>
        </div>
      </section>
    );
  }

  const displayName =
    profile.display_name ||
    profile.displayName ||
    'Player';

  const username =
    profile.username ||
    'player';

  const initial =
    displayName.charAt(0).toUpperCase();

  return (
    <section className="profilePage">
      <div className="profileHero card">
        <div className="profileAvatar">
          {initial}
        </div>

        <div className="profileIdentity">
          <div className="eyebrow">YOUR PROFILE</div>

          <h1>{displayName}</h1>

          <p className="profileUsername">
            @{username}
          </p>

          {profile.bio && (
            <p className="profileBio">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="profileActions">
          <button
            className="outlineButton"
            onClick={onEdit}
          >
            <Pencil size={15} />
            Edit profile
          </button>

          <button
            className="outlineButton"
            onClick={onLogout}
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      </div>

      <div className="profileGrid">
        <div className="card profileInfoCard">
          <div className="sectionTitle">
            <h2>About you</h2>
          </div>

          <div className="profileDetails">
            <div>
              <span>Username</span>
              <strong>@{username}</strong>
            </div>

            <div>
              <span>Timezone</span>
              <strong>
                {profile.timezone || 'Not set'}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {session.user?.email || 'Hidden'}
              </strong>
            </div>
          </div>
        </div>

        <div className="card profileInfoCard">
          <div className="sectionTitle">
            <h2>Games</h2>
          </div>

          <div className="empty">
            <Gamepad2 size={24} />
            <div>
              Add your games to start finding
              compatible teammates.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function Empty({text}){return <div className="empty"><Gamepad2 size={24}/><div>{text}</div></div>}

function LoginModal({close,onToast,onSession}){
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [signup,setSignup]=useState(false);const [busy,setBusy]=useState(false);
 async function submit(e){e.preventDefault();setBusy(true);if(!supabase){onSession({user:{email}});onToast(signup?'Demo account created.':'Demo profile loaded.');setBusy(false);return}const result=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});if(result.error)onToast(result.error.message);else{onSession(result.data.session);onToast(signup?'Account created! Check your email if confirmation is enabled.':'Welcome back!')}setBusy(false)}
 return <div className="modalBackdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={close}><X/></button><div className="brand modalBrand"><div className="brandMark">S</div><div>SquadUp<span>.GG</span></div></div><h2>{signup?'Create your account':'Welcome back'}</h2><p>{signup?'Build a profile and start finding teammates.':'Log in to build your squad.'}</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" minLength="6" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label><button className="primaryButton" disabled={busy}>{busy?(signup?'Creating...':'Signing in...'):(signup?'Create account':'Log in')}</button></form><button className="switchAuth" onClick={()=>setSignup(!signup)}>{signup?'Already have an account? Log in':'Need an account? Sign up'}</button><small className="modalNote">{isConfigured?'Connected to Supabase Auth.':'Demo mode is active. Add Supabase keys to enable persistent accounts.'}</small></div></div>
}
function LfgModal({close,games,defaultGame,onCreate}){
 const [game,setGame]=useState(defaultGame||games[0].name);const [mode,setMode]=useState('');const [need,setNeed]=useState(1);const [text,setText]=useState('');const [voice,setVoice]=useState(true);const current=games.find(g=>g.name===game)||games[0];
 return <div className="modalBackdrop" onMouseDown={close}><div className="modal wide" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={close}><X/></button><div className="eyebrow">LOOKING FOR GROUP</div><h2>Post an LFG</h2><p>Tell players exactly what you are looking for.</p><form onSubmit={e=>{e.preventDefault();onCreate({game,mode:mode||current.modes[0],need:Number(need),text:text||'Looking for teammates.',voice})}}><div className="formGrid"><label>Game<select value={game} onChange={e=>{setGame(e.target.value);setMode('')}}>{games.map(g=><option key={g.id}>{g.name}</option>)}</select></label><label>Game mode<select value={mode||current.modes[0]} onChange={e=>setMode(e.target.value)}>{current.modes.map(m=><option key={m}>{m}</option>)}</select></label><label>Players needed<input type="number" min="1" max="99" value={need} onChange={e=>setNeed(e.target.value)}/></label></div><label>Message<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What kind of teammates are you looking for?"/></label><label className="checkRow"><input type="checkbox" checked={voice} onChange={e=>setVoice(e.target.checked)}/><Mic size={15}/> Voice required</label><button className="primaryButton">Publish LFG</button></form></div></div>
}
function ProfileModal({profile, close, onSave}) {
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
    timezone: profile?.timezone || '',
    bio: profile?.bio || ''
  });

  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function submit(e) {
    e.preventDefault();

    if (!form.display_name.trim()) {
      return;
    }

    if (!form.username.trim()) {
      return;
    }

    setSaving(true);

    try {
      await onSave({
        display_name: form.display_name.trim(),
        username: form.username.trim().toLowerCase(),
        timezone: form.timezone.trim(),
        bio: form.bio.trim()
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalBackdrop" onMouseDown={close}>
      <div
        className="modal"
        onMouseDown={e => e.stopPropagation()}
      >
        <button className="close" onClick={close}>
          <X/>
        </button>

        <div className="eyebrow">ACCOUNT</div>

        <h2>Edit profile</h2>

        <p>
          Make it easier for the right players to find you.
        </p>

        <form onSubmit={submit}>
          <label>
            Display name
            <input
              value={form.display_name}
              onChange={e => update('display_name', e.target.value)}
              placeholder="Your display name"
              maxLength={40}
              required
            />
          </label>

          <label>
            Username
            <input
              value={form.username}
              onChange={e =>
                update(
                  'username',
                  e.target.value
                    .replace(/\s/g, '')
                    .toLowerCase()
                )
              }
              placeholder="username"
              maxLength={30}
              required
            />
          </label>

          <label>
            Timezone
            <input
              value={form.timezone}
              onChange={e => update('timezone', e.target.value)}
              placeholder="America/New_York"
              maxLength={64}
            />
          </label>

          <label>
            Bio
            <textarea
              maxLength={240}
              value={form.bio}
              onChange={e => update('bio', e.target.value)}
              placeholder="Tell people what you like to play..."
            />
          </label>

          <button
            className="primaryButton"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
