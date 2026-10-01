import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import{createClient}from"@supabase/supabase-js";
import"./styles.css";

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL;
const supabaseKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase=supabaseUrl&&supabaseKey?createClient(supabaseUrl,supabaseKey):null;

const steps=[["SIPE","Investor Profile"],["FHAE","Financial Health"],["FLAE","Financial Literacy"],["BVE","Investment Behaviour"],["IRE","Investment Readiness"],["REC","Investment Plan"],["XAI","Why This Recommendation?"],["FALE","Feedback & Learning"]];

const LQ=[
["If inflation is higher than the return on an investment, purchasing power generally:","Increases|Decreases|Stays the same|Cannot change",1],
["What is diversification mainly intended to do?","Guarantee profit|Reduce concentration risk|Eliminate all market risk|Increase taxes",1],
["What does SIP commonly refer to in mutual fund investing?","A fixed periodic investment method|A type of insurance|A tax notice|A bank loan",0],
["A higher expected return generally comes with:","No risk|Some form of higher uncertainty/risk|Guaranteed loss|No variation",1],
["What does P/E broadly compare?","Price with earnings|Profit with expenses|Debt with equity|Dividend with tax",0],
["Why is an emergency fund useful?","For short-term financial shocks|To guarantee returns|To avoid diversification|To increase leverage",0]
];
const BQ=[
["If the market falls sharply, what are you most likely to do?","Sell everything immediately|Wait and review the situation|Invest more after reviewing fundamentals|Follow whatever friends are doing","5|15|20|5"],
["When making an investment decision, which approach best describes you?","I rely mainly on others|I consider multiple sources|I do my own analysis|I follow recent market trends","5|15|20|10"],
["How comfortable are you with a diversified portfolio?","Not comfortable|Somewhat comfortable|Comfortable|Very comfortable","5|10|15|20"],
["How would you describe your investment confidence?","Low|Moderate|Good|High","5|10|15|20"],
["When a popular stock is discussed widely, I:","Buy immediately|Research before deciding|Ignore all information|Buy because others are buying","5|20|10|5"],
["If an investment performs poorly for a short period, I:","Panic sell|Review fundamentals and horizon|Keep checking price constantly|Ask friends what to do","5|20|10|8"]
];

const blank={gender:"",education:"",occupation:"",marital:"",age:"",dependents:"",income:"",expenses:"",goal:"",horizon:"",experience:"",emergency:"",loans:"",insurance:"",existingInvestments:"",lAnswers:{},bAnswers:{},rating:"",feedback:"",recommendationStatus:""};

function nextId(){
 const existing=localStorage.getItem("aidss_participant_id");
 if(existing)return existing;
 const id="P"+crypto.randomUUID().replaceAll("-","").slice(0,8).toUpperCase();
 localStorage.setItem("aidss_participant_id",id);
 return id;
}
function App(){
 const[page,setPage]=useState("home"),[step,setStep]=useState(0),[d,setD]=useState({...blank}),[records,setRecords]=useState(()=>JSON.parse(localStorage.getItem("aidss_records")||"[]")),[weights,setWeights]=useState(()=>JSON.parse(localStorage.getItem("aidss_weights")||'{"profile":25,"health":25,"literacy":25,"behaviour":25}'));
 const u=(k,v)=>setD(x=>({...x,[k]:v}));
 useEffect(()=>localStorage.setItem("aidss_records",JSON.stringify(records)),[records]); useEffect(()=>localStorage.setItem("aidss_weights",JSON.stringify(weights)),[weights]);

 const profileScore=useMemo(()=>{let x=0,a=+d.age;
 if(a>=25&&a<=45)x+=20;else if(a>0)x+=15;
 if(+d.income>=50000)x+=15;else if(+d.income>=25000)x+=12;else if(+d.income)x+=8;
 if(["Graduate","Postgraduate"].includes(d.education))x+=15;else if(d.education)x+=10;
 if(["3-5 years","5+ years"].includes(d.experience))x+=10;else if(d.experience)x+=6;
 if(d.goal)x+=20;if(d.horizon==="10+ years")x+=20;else if(d.horizon)x+=14;return Math.min(x,100)},[d]);
 const healthScore=useMemo(()=>{let i=+d.income||0,e=+d.expenses||0;if(!i)return 0;let ratio=Math.max(0,(i-e)/i*100),x=ratio>=40?20:ratio>=20?15:ratio>0?8:0;
 x+=d.emergency==="6+ months"?20:d.emergency==="3-6 months"?16:d.emergency==="1-3 months"?10:3;
 x+=d.loans==="Low"?20:d.loans==="Moderate"?14:d.loans?7:0;
 x+=d.insurance==="Both"?20:d.insurance==="One"?12:5;
 x+=d.existingInvestments==="Yes"?20:10;return Math.min(x,100)},[d]);
 const literacyScore=useMemo(()=>{let n=0;LQ.forEach((q,i)=>{if(+d["l"+i]===q[2])n++});return Math.round(n/LQ.length*100)},[d]);
 const behaviourScore=useMemo(()=>{let t=0,n=0;BQ.forEach((q,i)=>{if(d["b"+i]!=null){t+=+q[2].split("|")[d["b"+i]];n++}});return n?Math.round(t/n*5):0},[d]);
 const wsum=+weights.profile + +weights.health + +weights.literacy + +weights.behaviour || 100; const iri=Math.round((profileScore*(+weights.profile/wsum))+(healthScore*(+weights.health/wsum))+(literacyScore*(+weights.literacy/wsum))+(behaviourScore*(+weights.behaviour/wsum)));
 const category=iri>=80?"Highly Ready":iri>=60?"Moderately Ready":iri>=40?"Partially Ready":"Not Ready";
 const allocation=useMemo(()=>{let e=iri>=80?60:iri>=60?50:40,b=iri>=60?15:25,g=10,c=100-e-b-g;return{Equity:e,"Debt / Bonds":b,Gold:g,Cash:c}},[iri]);

 const saveParticipant=async()=>{
  const submittedAt=new Date().toISOString();
  const rec={...d,participantId:d.participantId,submittedAt,profileScore,healthScore,literacyScore,behaviourScore,iri,category,allocation,weights,consent:true};
  setRecords(r=>[...r.filter(x=>x.participantId!==d.participantId),rec]);
  if(!supabase){alert("Supabase is not configured. The response was saved locally only.");return false;}
  const payload={
    participant_id:d.participantId, consent:true, consent_at:submittedAt, age:Number(d.age)||null, gender:d.gender||null, education:d.education||null, occupation:d.occupation||null, marital_status:d.marital||null, dependents:Number(d.dependents)||0,
    monthly_income:Number(d.income)||0, monthly_expenses:Number(d.expenses)||0, investment_goal:d.goal||null, investment_horizon:d.horizon||null, investment_experience:d.experience||null,
    profile_score:profileScore, financial_health_score:healthScore, financial_literacy_score:literacyScore, behaviour_score:behaviourScore, investment_readiness_index:iri, readiness_category:category,
    recommendation_status:d.recommendationStatus||null, feedback_rating:d.rating?Number(String(d.rating).split(" ")[0]):null, feedback_comment:d.feedback||null, allocation, weights,
    response_data:{
      sipe:{age:d.age,gender:d.gender,education:d.education,occupation:d.occupation,marital:d.marital,dependents:d.dependents,income:d.income,expenses:d.expenses,goal:d.goal,horizon:d.horizon,experience:d.experience},
      fhae:{emergency:d.emergency,loans:d.loans,insurance:d.insurance,existingInvestments:d.existingInvestments},
      flae:Object.fromEntries(LQ.map((q,i)=>["q"+(i+1),d["l"+i]])),
      bve:Object.fromEntries(BQ.map((q,i)=>["q"+(i+1),d["b"+i]])),
      scores:{profileScore,healthScore,literacyScore,behaviourScore,iri,category}
    }
  };
  const {error}=await supabase.from("participants").insert(payload);
  if(error){console.error(error);alert("The response was saved locally, but could not be uploaded to the research database.\n\n"+error.message);return false;}
  return true;
 };
 const start=()=>{setD({...blank,participantId:nextId()});setStep(0);setPage("consent")};
 const validateSIPE=()=>["age","gender","education","occupation","marital","dependents","income","expenses","goal","horizon","experience"].every(k=>d[k]!==""&&d[k]!=null);
 const validateFHAE=()=>["emergency","loans","insurance","existingInvestments"].every(k=>d[k]);
 const goNext=()=>{if(step===0&&!validateSIPE())return alert("Please complete all SIPE fields.");if(step===1&&!validateFHAE())return alert("Please complete all FHAE fields.");setStep(s=>Math.min(7,s+1))};

 if(page==="home")return <div className="landing"><div className="hero"><div className="brand">AI INVESTMENT DSS</div><h1>AI-Driven Investment Planning<br/>Decision Support System</h1><p>Understand your financial position. Plan better. Make informed investment decisions.</p><button className="primary big" onClick={start}>START ASSESSMENT</button><button className="secondary" onClick={()=>setPage("admin")}>RESEARCH / ADMIN</button><div className="features"><span>✓ Investor Profiling</span><span>✓ Financial Health</span><span>✓ Behaviour Analysis</span><span>✓ Explainable Recommendations</span></div></div></div>;

 if(page==="admin")return <Admin records={records} weights={weights} setWeights={setWeights} onBack={()=>setPage("home")} onClear={()=>{if(confirm("Delete all local research records?")){setRecords([]);localStorage.removeItem("aidss_records")}}}/>;

 if(page==="consent")return <Wrap><Card><div className="brand">RESEARCH CONSENT</div><h2>Before You Begin</h2><p>This assessment is part of an AI-driven investment planning decision support research prototype. The information provided will be used to assess investor profile, financial health, financial literacy, investment behaviour and investment readiness.</p><p>Participation should be voluntary. Do not enter unnecessary sensitive personal information.</p><label className="check"><input type="checkbox" id="consent"/> I have read and understood the information and voluntarily agree to participate.</label><button className="primary" onClick={()=>document.getElementById("consent").checked?setPage("app"):alert("Please provide consent.")}>I AGREE & CONTINUE</button></Card></Wrap>;

 if(page==="complete")return <Wrap><Card className="center"><div className="brand">ASSESSMENT COMPLETE</div><h1>Thank You</h1><p>Participant ID: <b>{d.participantId}</b></p><div className="score">{iri}<small>/100</small></div><h3>{category}</h3><p>Your research-prototype responses have been submitted to the research database.</p><button className="primary" onClick={()=>{localStorage.removeItem("aidss_participant_id");setPage("home")}}>FINISH</button></Card></Wrap>;

 const screens=[
 <SIPE d={d} u={u}/>,<FHAE d={d} u={u}/>,<FLAE d={d} u={u}/>,<BVE d={d} u={u}/>,
 <IRE iri={iri} category={category} scores={[profileScore,healthScore,literacyScore,behaviourScore]}/>,
 <REC iri={iri} goal={d.goal} horizon={d.horizon} allocation={allocation} onStatus={v=>u("recommendationStatus",v)}/>,
 <XAI iri={iri} scores={[profileScore,healthScore,literacyScore,behaviourScore]} allocation={allocation}/>,
 <FALE d={d} u={u} onSubmit={async()=>{const ok=await saveParticipant();if(ok)setPage("complete")}}/>
 ];
 return <div className="app"><header><div className="brand">AI INVESTMENT DSS</div><span>Participant: {d.participantId}</span></header><main className="container"><Progress step={step}/>{screens[step]}<div className="actions">{step>0&&<button className="secondary" onClick={()=>setStep(s=>s-1)}>BACK</button>}{step<7&&<button className="primary" onClick={goNext}>{step===6?"CONTINUE TO FEEDBACK":"SAVE & CONTINUE"}</button>}</div></main></div>;
}

function Progress({step}){return <><div className="progressTop"><span>Step {step+1} of 8</span><span>{Math.round((step+1)/8*100)}%</span></div><div className="progress"><i style={{width:`${(step+1)/8*100}%`}}/></div><div className="steps">{steps.map((x,i)=><div key={x[0]} className={i===step?"active":i<step?"done":""}><b>{x[0]}</b><small>{x[1]}</small></div>)}</div></>}
function Wrap({children}){return <div className="wrap">{children}</div>}
function Card({children,className=""}){return <section className={"card "+className}>{children}</section>}
function F({lab,type="text",val,onChange}){return <label className="field">{lab}<input type={type} value={val||""} onChange={e=>onChange(e.target.value)}/></label>}
function S({lab,val,onChange,opts}){return <label className="field">{lab}<select value={val||""} onChange={e=>onChange(e.target.value)}><option value="">Select</option>{opts.map(x=><option key={x}>{x}</option>)}</select></label>}

function SIPE({d,u}){return <Card><small>STEP 1 • SIPE</small><h2>Tell Us About Yourself</h2><p className="muted">Smart Investor Profiling Engine</p><div className="participant">Participant ID: <b>{d.participantId}</b></div><h3>Personal Information</h3><div className="grid"><F lab="Age" type="number" val={d.age} onChange={v=>u("age",v)}/><S lab="Gender" val={d.gender} onChange={v=>u("gender",v)} opts={["Male","Female","Other","Prefer not to say"]}/><S lab="Education" val={d.education} onChange={v=>u("education",v)} opts={["Higher Secondary","Diploma","Graduate","Postgraduate","Other"]}/><S lab="Occupation" val={d.occupation} onChange={v=>u("occupation",v)} opts={["Private Employee","Government Employee","Business","Self-employed","Student","Other"]}/><S lab="Marital Status" val={d.marital} onChange={v=>u("marital",v)} opts={["Single","Married","Other / Prefer not to say"]}/><F lab="Number of Dependents" type="number" val={d.dependents} onChange={v=>u("dependents",v)}/></div><h3>Financial Information</h3><div className="grid"><F lab="Monthly Income (₹)" type="number" val={d.income} onChange={v=>u("income",v)}/><F lab="Monthly Expenses (₹)" type="number" val={d.expenses} onChange={v=>u("expenses",v)}/></div><h3>Investment Information</h3><div className="grid"><S lab="Investment Goal" val={d.goal} onChange={v=>u("goal",v)} opts={["Children's Education","Retirement","Wealth Creation","Home Purchase","Emergency / Safety","Other"]}/><S lab="Investment Horizon" val={d.horizon} onChange={v=>u("horizon",v)} opts={["Below 3 years","3-5 years","5-10 years","10+ years"]}/><S lab="Investment Experience" val={d.experience} onChange={v=>u("experience",v)} opts={["None","Less than 1 year","1-3 years","3-5 years","5+ years"]}/></div></Card>}

function FHAE({d,u}){return <Card><small>STEP 2 • FHAE</small><h2>Understand Your Financial Health</h2><p className="muted">Financial Health Assessment Engine</p><div className="grid"><S lab="Emergency Fund" val={d.emergency} onChange={v=>u("emergency",v)} opts={["Less than 1 month","1-3 months","3-6 months","6+ months"]}/><S lab="Debt / Loan Burden" val={d.loans} onChange={v=>u("loans",v)} opts={["Low","Moderate","High"]}/><S lab="Insurance Coverage" val={d.insurance} onChange={v=>u("insurance",v)} opts={["None","One","Both"]}/><S lab="Existing Investments" val={d.existingInvestments} onChange={v=>u("existingInvestments",v)} opts={["Yes","No"]}/></div><div className="info">FHAE assesses savings capacity, emergency preparedness, debt burden, insurance and existing investment status.</div></Card>}

function Quiz({title,sub,qs,prefix,d,u}){return <Card><small>{sub}</small><h2>{title}</h2>{qs.map((q,i)=><div key={i} className="question"><b>{i+1}. {q[0]}</b>{q[1].split("|").map((o,j)=><label key={j} className="option"><input type="radio" name={prefix+i} checked={d[prefix+i]===j} onChange={()=>u(prefix+i,j)}/>{o}</label>)}</div>)}</Card>}
function FLAE({d,u}){return <Quiz title="Test Your Financial Knowledge" sub="STEP 3 • FLAE" qs={LQ} prefix="l" d={d} u={u}/>}
function BVE({d,u}){return <Quiz title="Understand Your Investment Behaviour" sub="STEP 4 • BVE" qs={BQ} prefix="b" d={d} u={u}/>}

function IRE({iri,category,scores}){return <Card className="center"><small>STEP 5 • IRE</small><h2>Your Investment Readiness</h2><p className="muted">Investment Readiness Engine</p><div className="score">{iri}<small>/100</small></div><h3>{category}</h3><div className="scores">{["Profile","Financial Health","Literacy","Behaviour"].map((x,i)=><div key={x}><span>{x}</span><b>{scores[i]}</b></div>)}</div><div className="info">The IRE weights are configurable in Research / Admin. The default is 25% each. Final weights and thresholds should be validated through the PhD methodology before formal conclusions.</div></Card>}

function REC({iri,goal,horizon,allocation,onStatus}){return <Card><small>STEP 6 • RECOMMENDATION</small><h2>Your Investment Plan</h2><div className="summary"><div><span>Goal</span><b>{goal||"Not specified"}</b></div><div><span>Horizon</span><b>{horizon||"Not specified"}</b></div><div><span>Readiness</span><b>{iri}/100</b></div></div><h3>Illustrative Asset Allocation</h3>{Object.entries(allocation).map(([k,v])=><div key={k} className="alloc"><span>{k}</span><b>{v}%</b><div><i style={{width:v+"%"}}/></div></div>)}<div className="warn">Research prototype only. This allocation is illustrative and is not individualized financial advice or a guarantee of returns.</div><div className="status"><b>What would you do with this recommendation?</b><label><input type="radio" name="status" onChange={()=>onStatus("Accepted")}/> Accept / use for further consideration</label><label><input type="radio" name="status" onChange={()=>onStatus("Modify")}/> Modify / review</label><label><input type="radio" name="status" onChange={()=>onStatus("Reject")}/> Reject</label></div></Card>}

function XAI({iri,scores,allocation}){return <Card><small>STEP 7 • XAI</small><h2>Why This Recommendation?</h2><p className="muted">Explainable Recommendation Engine</p><p>The prototype recommendation is influenced by the four assessment components and their combined Investment Readiness Index.</p>{[["Investment readiness",iri],["Investor profile",scores[0]],["Financial health",scores[1]],["Financial literacy",scores[2]],["Behaviour",scores[3]]].map(x=><div key={x[0]} className="factor"><span>{x[0]}</span><b>{x[1]}/100</b></div>)}<div className="info"><b>Allocation factors:</b> the prototype uses the IRI category to adjust the illustrative balance between equity, debt/bonds, gold and cash. In the research version, these rules should be formally specified and validated.</div></Card>}

function FALE({d,u,onSubmit}){return <Card><small>STEP 8 • FALE</small><h2>Your Feedback</h2><p className="muted">Feedback & Adaptive Learning Engine</p><S lab="How useful was the assessment?" val={d.rating} onChange={v=>u("rating",v)} opts={["1 - Not useful","2","3 - Neutral","4","5 - Very useful"]}/><label className="field">Comments<textarea rows="5" value={d.feedback||""} onChange={e=>u("feedback",e.target.value)} placeholder="Tell us what you think..."/></label><button className="primary" onClick={()=>d.rating?onSubmit():alert("Please select a rating.")}>SUBMIT & COMPLETE</button></Card>}

function Admin({records,weights,setWeights,onBack,onClear}){
 const saveWeights=()=>{const vals=Object.values(weights).map(Number);if(vals.some(v=>v<0)||vals.reduce((a,b)=>a+b,0)<=0)return alert("Enter valid positive weights.");setWeights({...weights});alert("Weights saved for this browser prototype.")};
 const exportCSV=()=>{
  if(!records.length)return alert("No records yet.");
  const keys=["participantId","submittedAt","profileScore","healthScore","literacyScore","behaviourScore","iri","category","age","gender","education","occupation","marital","dependents","income","expenses","goal","horizon","experience","emergency","loans","insurance","existingInvestments","recommendationStatus","rating","feedback"];
  const esc=v=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv=[keys.join(","),...records.map(r=>keys.map(k=>esc(r[k])).join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="AI_Investment_DSS_Research_Data.csv";document.body.appendChild(a);a.click();a.remove();
 };
 return <Wrap><Card><div className="brand">RESEARCH / ADMIN</div><h2>Participant Data Dashboard</h2><p className="muted">Local prototype storage • {records.length} participant record(s)</p>
 <div className="weightBox"><h3>IRE Research Weights</h3><p className="muted">Default is 25% each. Change these only according to your approved research methodology.</p><div className="weightGrid">
 {["profile","health","literacy","behaviour"].map(k=><label key={k} className="field">{k==="profile"?"SIPE / Profile":k==="health"?"FHAE / Financial Health":k==="literacy"?"FLAE / Financial Literacy":"BVE / Behaviour"}<input type="number" min="0" value={weights[k]} onChange={e=>setWeights(w=>({...w,[k]:e.target.value}))}/></label>)}</div>
 <p><b>Total: {Object.values(weights).reduce((a,b)=>a+Number(b),0)}%</b></p><button className="primary" onClick={saveWeights}>SAVE WEIGHTS</button></div>
 <div className="admin-actions"><button className="primary" onClick={exportCSV}>EXPORT CSV</button><button className="secondary" onClick={onBack}>BACK</button><button className="danger" onClick={onClear}>CLEAR LOCAL DATA</button></div>
 {records.length?<div className="tableWrap"><table><thead><tr><th>ID</th><th>Date</th><th>SIPE</th><th>FHAE</th><th>FLAE</th><th>BVE</th><th>IRI</th><th>Category</th><th>Rating</th></tr></thead><tbody>{records.map(r=><tr key={r.participantId}><td>{r.participantId}</td><td>{new Date(r.submittedAt).toLocaleString()}</td><td>{r.profileScore}</td><td>{r.healthScore}</td><td>{r.literacyScore}</td><td>{r.behaviourScore}</td><td>{r.iri}</td><td>{r.category}</td><td>{r.rating}</td></tr>)}</tbody></table></div>:<div className="info">No participant data collected yet.</div>}
 <div className="warn">This prototype stores research records in the browser's localStorage. For a real 50-participant study, move to a secure database with appropriate consent, access control, backup and data-governance measures.</div>
 </Card></Wrap>}
createRoot(document.getElementById("root")).render(<App/>);