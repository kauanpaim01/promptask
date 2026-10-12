/* ===================== CONFIGURAÇÃO ===================== */
const SUPABASE_URL = 'https://jhkgycttsuttrifuexzx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoa2d5Y3R0c3V0dHJpZnVleHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MzQ2OTIsImV4cCI6MjEwNzQxMDY5Mn0.5e8dZgfB_7fqw5WkSc2DlekY3YP34vw9VwrgoAaZo2A'; // chave pública (pode ficar no site)

// Links de pagamento da Cakto: cole cada link entre as aspas.
const CHECKOUT = {
  'mensal-1': 'https://pay.cakto.com.br/39zijn2_1196108',
  'mensal-2': 'https://pay.cakto.com.br/ez38r8c_1196173',
  'mensal-3': 'https://pay.cakto.com.br/je9f59n_1196180',
  'mensal-4': 'https://pay.cakto.com.br/35h3fni_1196238',
  'anual-1':  'https://pay.cakto.com.br/ytzy2pj_1196252',
  'anual-2':  'https://pay.cakto.com.br/t9uoyj4_1196261',
  'anual-3':  'https://pay.cakto.com.br/awtt9pk_1196267',
  'anual-4':  'https://pay.cakto.com.br/qij8wte_1196274'
};
const PRECOS = {
  mensal: {1:21.99, 2:24.99, 3:27.99, 4:29.99}, // 4 = todas as IAs
  anual:  {1:109.99, 2:129.99, 3:139.99, 4:149.99}
};
/* ======================================================== */

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const brl = v => 'R$ ' + v.toFixed(2).replace('.', ',');
function preco(n,per){return PRECOS[per][Math.min(Math.max(n,1),4)]}
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function zapNum(z){let d=(z||'').replace(/\D/g,''); if(d && !d.startsWith('55')) d='55'+d; return d;}
function ls(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,2400)}
async function copiar(txt,pre){try{await navigator.clipboard.writeText(txt);toast('Prompt copiado');return true}catch(e){if(pre){const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);toast('Texto selecionado: use Ctrl+C')}}}

/* ---------- dados públicos (sem o conteúdo pago) ---------- */
const IAS_PUB = [
  {id:'chatgpt',nome:'ChatGPT',tipo:'Arquivo HTML',como:'Gera o site inteiro em um arquivo. Use o <b>Canvas</b> para ver a prévia e baixar o código.'},
  {id:'claude',nome:'Claude',tipo:'Arquivo HTML',como:'Gera o site como <b>artifact</b>, com prévia ao lado da conversa e link para compartilhar.'},
  {id:'gemini',nome:'Gemini',tipo:'Arquivo HTML',como:'Use o <b>Canvas</b> do Gemini. Ele mostra a prévia e permite exportar o código.'},
  {id:'lovable',nome:'Lovable',tipo:'Projeto React',como:'Cria um projeto completo e publica com um clique.'},
  {id:'bolt',nome:'Bolt',tipo:'Projeto React',como:'Monta o projeto no navegador e publica pela Netlify.'},
  {id:'v0',nome:'v0',tipo:'Projeto Next.js',como:'Gera em Next.js e publica direto na Vercel.'}
];
const MODELOS_PUB = [
  {id:'servicos',nome:'Landing de serviços',desc:'Salão, oficina, estúdio, consultoria, prestador local. Foco em chamar no WhatsApp.',n:8},
  {id:'restaurante',nome:'Restaurante e delivery',desc:'Cardápio por categorias, preços e pedido com mensagem pronta no WhatsApp.',n:7},
  {id:'portfolio',nome:'Portfólio profissional',desc:'Para designer, fotógrafo, arquiteto, social media. Mostra trabalhos e gera contato.',n:6},
  {id:'catalogo',nome:'Catálogo com pedido no WhatsApp',desc:'Loja simples sem checkout: produtos em grade e botão “Pedir” por item.',n:6},
  {id:'captura',nome:'Página de captura',desc:'Para lançar curso, e-book ou lista de espera. Uma página, um objetivo.',n:7},
  {id:'saude',nome:'Clínica e consultório',desc:'Dentista, psicólogo, fisioterapeuta, nutricionista. Passa confiança e agenda pelo WhatsApp.',n:8}
];
const nomeIA = id => (IAS_PUB.find(i=>i.id===id)||{}).nome || id;

let S = {periodo:'mensal', ias:['chatgpt'], libIA:'chatgpt'};
Object.assign(S, ls('pt_escolha')||{});
function salvarEscolha(){ls('pt_escolha',{periodo:S.periodo,ias:S.ias})}

/* ---------- topo de exemplo ---------- */
function heroRender(){
  const g=id=>document.getElementById(id).value;
  document.getElementById('heroOut').innerHTML=`<span class="k"># Objetivo</span>
Criar o site completo de "${esc(g('hNome'))}", pronto para publicar.
Não me faça perguntas.

<span class="k"># Dados do negócio</span>
- Segmento: ${esc(g('hSeg'))}
- Cidade: ${esc(g('hCid'))}
- WhatsApp: https://wa.me/${zapNum(g('hZap'))}

<span class="k"># Seções, nesta ordem</span>
1. Topo com frase de valor e botão "Chamar no WhatsApp"
2. Serviços em cards …

<span class="k"># Prompt completo liberado na área do aluno</span>`;
}
['hNome','hSeg','hCid','hZap'].forEach(id=>document.getElementById(id).addEventListener('input',heroRender));

/* ---------- o que está incluso ---------- */
function libRender(){
  document.getElementById('libTabs').innerHTML=IAS_PUB.map(i=>`<button class="tab" role="tab" aria-selected="${i.id===S.libIA}" data-ia="${i.id}">${i.nome}<small>${i.tipo}</small></button>`).join('');
  const ia=IAS_PUB.find(i=>i.id===S.libIA);
  document.getElementById('libNote').innerHTML=`<b>Como usar no ${ia.nome}:</b> ${ia.como}`;
  document.getElementById('libCards').innerHTML=MODELOS_PUB.map(m=>`
    <div class="card"><div class="meta"><span class="pill">${ia.nome}</span><span class="pill">${m.n} seções</span></div>
    <h3>${m.nome}</h3><p>${m.desc}</p></div>`).join('')
    + `<div class="card" style="grid-column:1/-1;flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap"><p style="flex:1;min-width:220px"><b style="color:var(--ink)">Plano ${ia.nome}:</b> os 6 modelos, o gerador e o curso completo.</p><button class="btn accent sm" data-assinar="${ia.id}">Assinar ${ia.nome} por R$ 21,99/mês</button></div>`;
}
document.getElementById('libTabs').addEventListener('click',e=>{const b=e.target.closest('[data-ia]');if(!b)return;S.libIA=b.dataset.ia;libRender();});
document.getElementById('libCards').addEventListener('click',e=>{const b=e.target.closest('[data-assinar]');if(!b)return;
  S.ias=[b.dataset.assinar];plansRender();salvarEscolha();document.getElementById('planos').scrollIntoView({behavior:'smooth'});});

/* ---------- planos ---------- */
function plansRender(){
  document.getElementById('bMensal').setAttribute('aria-pressed',S.periodo==='mensal');
  document.getElementById('bAnual').setAttribute('aria-pressed',S.periodo==='anual');
  document.getElementById('aiPick').innerHTML=IAS_PUB.map(i=>`<label><input type="checkbox" value="${i.id}" ${S.ias.includes(i.id)?'checked':''}>${i.nome}</label>`).join('');
  const n=S.ias.length, v=preco(n,S.periodo);
  document.getElementById('tLabel').textContent=(S.periodo==='mensal'?'Plano mensal':'Plano anual')+' · '+(n>=4?'todas as IAs':n+(n===1?' IA':' IAs'));
  document.getElementById('tPrice').innerHTML=`${brl(v)} <small>/${S.periodo==='mensal'?'mês':'ano'}</small>`;
  const sub=document.getElementById('tSub');
  sub.textContent=n===0?'Marque pelo menos uma IA.':S.periodo==='anual'?`Equivale a ${brl(v/12)}/mês. Economia de ${brl(preco(n,'mensal')*12-v)} no ano.`:`No anual: ${brl(preco(n,'anual'))}/ano.`;
  if(n>=4&&n<IAS_PUB.length) sub.textContent+=' Com 4 ou mais IAs, você leva todas pelo mesmo preço.';
  const nomes=n>=4?IAS_PUB.map(i=>i.nome):S.ias.map(nomeIA);
  document.getElementById('tList').innerHTML=(n?[`Prompts de ${nomes.join(', ')}`,'6 modelos de site por IA','Gerador com sua ficha salva','Curso completo na área do aluno']:[]).map(x=>`<li>${x}</li>`).join('');
  document.getElementById('tBuy').disabled=n===0;
}
document.getElementById('aiPick').addEventListener('change',()=>{S.ias=[...document.querySelectorAll('#aiPick input:checked')].map(i=>i.value);plansRender();salvarEscolha();});
document.getElementById('bMensal').onclick=()=>{S.periodo='mensal';plansRender();salvarEscolha()};
document.getElementById('bAnual').onclick=()=>{S.periodo='anual';plansRender();salvarEscolha()};
document.getElementById('priceTable').innerHTML=[1,2,3,4].map(n=>`<tr><td>${n===4?'Todas as IAs (6)':n+(n===1?' IA':' IAs')}</td><td>${brl(PRECOS.mensal[n])}</td><td>${brl(PRECOS.anual[n])}</td><td>${brl(PRECOS.anual[n]/12)}</td></tr>`).join('');
const COMBOS=[
  {nome:'Iniciante Lovable',per:'mensal',ias:['lovable'],tag:'Para começar hoje'},
  {nome:'Anual ChatGPT + Claude',per:'anual',ias:['chatgpt','claude'],tag:'Mais vendido',feat:true},
  {nome:'Anual Completo',per:'anual',ias:IAS_PUB.map(i=>i.id),tag:'Todas as IAs'}
];
document.getElementById('combos').innerHTML=COMBOS.map((c,i)=>`<div class="combo ${c.feat?'feat':''}"><span class="eyebrow">${c.tag}</span><h3>${c.nome}</h3>
  <div class="p">${brl(preco(c.ias.length,c.per))} <small>/${c.per==='mensal'?'mês':'ano'}</small></div>
  <div class="tags">${c.ias.map(id=>`<span class="pill">${nomeIA(id)}</span>`).join('')}</div>
  <button class="btn ${c.feat?'accent':'ghost'}" data-combo="${i}">Quero este</button></div>`).join('');
document.getElementById('combos').addEventListener('click',e=>{const b=e.target.closest('[data-combo]');if(!b)return;const c=COMBOS[+b.dataset.combo];S.periodo=c.per;S.ias=[...c.ias];plansRender();salvarEscolha();irCheckout();});
document.getElementById('tBuy').onclick=irCheckout;
function irCheckout(){
  const n=Math.min(S.ias.length,4); if(!n) return;
  salvarEscolha();
  const link=CHECKOUT[`${S.periodo}-${n}`];
  if(!link){toast('Pagamento em configuração. Volte em breve.');return;}
  location.href=link;
}

/* ===================== ÁREA DO ALUNO ===================== */
let sess=null, ass=null, C=null, aTab='aulas', carregando=false, erroArea='';
const ficha = Object.assign({nome:'',segmento:'',cidade:'',publico:'',servicos:'',difer:'',zap:'',insta:'',cor1:'#2B3FF0',cor2:'#E8EAF3',estilo:'moderno e minimalista',tom:'próximo e acolhedor'}, ls('pt_ficha')||{});
const gen = {ia:null, mod:'servicos'};

function ativa(a){return a && ['ativa','cancelada'].includes(a.status) && new Date(a.pago_ate) > new Date()}
function iasLiberadas(){return ass?ass.ias:[]}
function temIA(id){return iasLiberadas().includes(id)}
function dataBR(d){return new Date(d).toLocaleDateString('pt-BR')}

async function carregarAluno(){
  carregando=true; erroArea=''; areaRender();
  const {data,error}=await sb.from('assinaturas').select('*').maybeSingle();
  if(error){erroArea='Não consegui carregar sua assinatura. Tente de novo em instantes.';}
  ass=data||null;
  if(ativa(ass)){
    const r=await sb.from('conteudo').select('id,tipo,ordem,dados').order('ordem');
    if(r.error){erroArea='Não consegui carregar os prompts. Tente de novo em instantes.';}
    else{
      const rows=r.data||[];
      C={ias:{},iaOrdem:[],modelos:[],template:'',aulas:[]};
      rows.forEach(x=>{
        if(x.tipo==='ia'){C.ias[x.id]=x.dados;C.iaOrdem.push(x.id);}
        else if(x.tipo==='modelo')C.modelos.push(x.dados);
        else if(x.tipo==='template')C.template=x.dados.texto;
        else if(x.tipo==='aula')C.aulas.push(x.dados);
      });
      // Se o aluno ainda não escolheu as IAs, aplica a escolha feita antes da compra
      if(ass.ias.length===0){
        const pre=(ls('pt_escolha')||{}).ias||[];
        if(pre.length && pre.length<=ass.plano_qtd){
          const u=await sb.rpc('escolher_ias',{p_ias:pre});
          if(!u.error&&u.data) ass=u.data;
        }
      }
    }
  }
  carregando=false; areaRender();
}

function montarPrompt(iaId,modId,d){
  const ia=C.ias[iaId], m=C.modelos.find(x=>x.id===modId);
  const num=zapNum(d.zap);
  const v={nome:d.nome||'[NOME DO NEGÓCIO]',modelo:m.nome,segmento:d.segmento||'[SEGMENTO]',cidade:d.cidade||'[CIDADE]',
    publico:d.publico||'clientes da região',
    servicos:(d.servicos||'').split('\n').map(s=>s.trim()).filter(Boolean).map(s=>'  - '+s).join('\n')||'  - [SERVIÇOS]',
    difer:d.difer||'não informado',zap:d.zap||'[WHATSAPP]',num:num||'[NUMERO]',insta:d.insta||'não informado (não exiba)',
    secoes:m.secoes.map((s,i)=>(i+1)+'. '+s).join('\n'),cor1:d.cor1,cor2:d.cor2,estilo:d.estilo,tom:d.tom,
    extras:ia.extra.map(e=>'- '+e).join('\n'),ia:ia.nome,saida:ia.saida};
  return C.template.replace(/\{\{(\w+)\}\}/g,(_,k)=>v[k]??'');
}

function genRender(hostId){
  const host=document.getElementById(hostId), d=ficha, p=hostId;
  if(!gen.ia||!temIA(gen.ia)) gen.ia=iasLiberadas()[0];
  const m=C.modelos.find(x=>x.id===gen.mod)||C.modelos[0]; gen.mod=m.id;
  host.innerHTML=`
  <form class="panel form" id="${p}F" autocomplete="off">
    <div class="row">
      <label>IA<select id="${p}ia">${iasLiberadas().map(id=>`<option value="${id}" ${id===gen.ia?'selected':''}>${esc(C.ias[id].nome)}</option>`).join('')}</select></label>
      <label>Modelo<select id="${p}mod">${C.modelos.map(x=>`<option value="${x.id}" ${x.id===gen.mod?'selected':''}>${esc(x.nome)}</option>`).join('')}</select></label>
    </div>
    <label>Nome do negócio<input id="${p}nome" value="${esc(d.nome)}" placeholder="Ex.: Studio Bella Unhas"></label>
    <div class="row"><label>Segmento<input id="${p}segmento" value="${esc(d.segmento)}" placeholder="Ex.: manicure"></label><label>Cidade<input id="${p}cidade" value="${esc(d.cidade)}" placeholder="Ex.: Curitiba, PR"></label></div>
    <label>Público <span class="h">quem você quer atender</span><input id="${p}publico" value="${esc(d.publico)}"></label>
    <label>Serviços ou produtos <span class="h">um por linha</span><textarea id="${p}servicos">${esc(d.servicos)}</textarea></label>
    <label>Diferenciais<input id="${p}difer" value="${esc(d.difer)}"></label>
    <div class="row"><label>WhatsApp<input id="${p}zap" value="${esc(d.zap)}" inputmode="tel" placeholder="(41) 99999-0000"></label><label>Instagram<input id="${p}insta" value="${esc(d.insta)}"></label></div>
    <div class="row"><label>Cor principal<input type="color" id="${p}cor1" value="${esc(d.cor1)}"></label><label>Cor de apoio<input type="color" id="${p}cor2" value="${esc(d.cor2)}"></label></div>
    <div class="row">
      <label>Estilo<select id="${p}estilo">${['elegante e delicado','moderno e minimalista','divertido e colorido','sério e confiável','rústico e acolhedor','premium e sofisticado'].map(o=>`<option ${o===d.estilo?'selected':''}>${o}</option>`).join('')}</select></label>
      <label>Tom do texto<select id="${p}tom">${['próximo e acolhedor','profissional e direto','animado e jovem','técnico e preciso'].map(o=>`<option ${o===d.tom?'selected':''}>${o}</option>`).join('')}</select></label>
    </div>
  </form>
  <div class="outbox">
    <div class="head"><div><div class="eyebrow">Prompt para ${esc(C.ias[gen.ia].nome)}</div><strong>${esc(m.nome)}</strong></div>
      <button class="btn accent sm" id="${p}copy">Copiar prompt</button></div>
    <div class="term"><div class="term-bar"><i></i><i></i><i></i><span>prompt-${esc(gen.ia)}-${esc(gen.mod)}.txt</span><b></b></div>
    <pre id="${p}out">${esc(montarPrompt(gen.ia,gen.mod,d))}</pre></div>
  </div>`;
  const f=document.getElementById(p+'F');
  f.addEventListener('input',()=>{
    ['nome','segmento','cidade','publico','servicos','difer','zap','insta','cor1','cor2','estilo','tom'].forEach(k=>d[k]=document.getElementById(p+k).value);
    ls('pt_ficha',d);
    const ni=document.getElementById(p+'ia').value, nm=document.getElementById(p+'mod').value;
    if(ni!==gen.ia||nm!==gen.mod){gen.ia=ni;gen.mod=nm;genRender(hostId);return;}
    document.getElementById(p+'out').textContent=montarPrompt(gen.ia,gen.mod,d);
  });
  f.addEventListener('submit',e=>e.preventDefault());
  const cb=document.getElementById(p+'copy');
  cb.onclick=async()=>{const ok=await copiar(montarPrompt(gen.ia,gen.mod,d),document.getElementById(p+'out'));
    if(ok){cb.classList.add('ok');cb.textContent='Copiado ✓';setTimeout(()=>{cb.classList.remove('ok');cb.textContent='Copiar prompt';},1800);}};
}

function escolhaIAsHTML(){
  const lim=ass.plano_qtd, atual=ass.ias.length?ass.ias:((ls('pt_escolha')||{}).ias||[]).slice(0,lim);
  return `<form class="panel form" id="escolhaF" style="max-width:640px">
    <span class="eyebrow">Seu plano libera ${lim} IA${lim>1?'s':''}</span>
    <h2 style="font-size:26px">Escolha ${lim>1?'as IAs':'a IA'} que você vai usar</h2>
    <div class="ai-pick">${IAS_PUB.map(i=>`<label><input type="checkbox" value="${i.id}" ${atual.includes(i.id)?'checked':''}>${i.nome}</label>`).join('')}</div>
    <div id="escErr" role="alert" hidden style="color:var(--muted);font-size:14px"></div>
    <button class="btn accent" type="submit">Salvar escolha</button>
  </form>`;
}
function ligarEscolha(){
  const f=document.getElementById('escolhaF'); if(!f) return;
  const lim=ass.plano_qtd, err=document.getElementById('escErr');
  f.addEventListener('change',e=>{const marcadas=f.querySelectorAll('input:checked');if(marcadas.length>lim){e.target.checked=false;err.textContent=`Seu plano permite ${lim} IA${lim>1?'s':''}. Desmarque uma para trocar.`;err.hidden=false;}});
  f.addEventListener('submit',async e=>{e.preventDefault();
    const ias=[...f.querySelectorAll('input:checked')].map(i=>i.value);
    if(!ias.length){err.textContent='Marque pelo menos uma IA.';err.hidden=false;return;}
    const {data,error}=await sb.rpc('escolher_ias',{p_ias:ias});
    if(error){err.textContent=error.message;err.hidden=false;return;}
    ass=data; ls('pt_escolha',{periodo:ass.periodo,ias:ass.ias}); aTab='prompts'; toast('IAs salvas'); areaRender();
  });
}

function areaRender(){
  const host=document.getElementById('area');
  if(!sess){
    host.innerHTML=`<div class="wrap"><form class="login panel form" id="loginF">
      <span class="eyebrow">Área do aluno · só para assinantes</span><h1>Entrar na <span class="serif">Promptask</span></h1>
      <label>E-mail usado na compra<input id="lEmail" type="email" required autocomplete="email"></label>
      <div id="lMsg" role="status" hidden style="background:var(--sunk);border-radius:8px;padding:12px;font-size:14px"></div>
      <button class="btn accent" type="submit" id="lBtn">Receber link de acesso</button>
      <span style="color:var(--muted);font-size:13px">Você recebe um link no e-mail. Não precisa de senha.</span>
      <a class="btn ghost" href="#planos">Ainda não sou assinante: ver planos</a>
    </form></div>`;
    document.getElementById('loginF').addEventListener('submit',async e=>{e.preventDefault();
      const email=document.getElementById('lEmail').value.trim().toLowerCase(), msg=document.getElementById('lMsg'), btn=document.getElementById('lBtn');
      btn.disabled=true;
      const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname+'?aluno=1'}});
      btn.disabled=false; msg.hidden=false;
      msg.textContent=error?'Não consegui enviar o link agora. Espere um minuto e tente de novo.':`Enviamos um link para ${email}. Abra o e-mail e toque em "Entrar". Confira também o spam.`;
    });
    return;
  }
  const email=sess.user.email;
  if(carregando){host.innerHTML=`<div class="wrap aluno"><div class="side"><div class="panel" style="display:grid;gap:12px"><div class="skel" style="height:44px"></div><div class="skel" style="height:12px"></div><div class="skel" style="height:8px"></div></div><div class="panel" style="display:grid;gap:10px">${'<div class="skel" style="height:14px"></div>'.repeat(7)}</div></div><div style="display:grid;gap:16px;align-content:start"><div class="skel" style="height:96px;border-radius:16px"></div><div class="skel" style="height:40px;width:60%"></div><div class="skel" style="height:280px;border-radius:14px"></div></div></div>`;return;}
  if(erroArea){host.innerHTML=`<div class="wrap"><div class="login panel form"><p>${erroArea}</p><button class="btn accent" id="tentar">Tentar de novo</button></div></div>`;document.getElementById('tentar').onclick=carregarAluno;return;}
  if(!ativa(ass)){
    const motivo = !ass ? `Não encontramos assinatura para <b>${esc(email)}</b>.` :
      ass.status==='reembolsada' ? 'Sua compra foi reembolsada, então o acesso foi encerrado.' :
      ass.status==='chargeback' ? 'O pagamento foi contestado no cartão, então o acesso foi bloqueado.' :
      `Sua assinatura venceu em ${dataBR(ass.pago_ate)}.`;
    host.innerHTML=`<div class="wrap"><div class="login panel form">
      <span class="eyebrow">Área do aluno</span><h1 style="font-size:30px">Acesso não liberado</h1>
      <p>${motivo}</p>
      <p style="color:var(--muted);font-size:14px">Acabou de pagar? A liberação leva alguns minutos depois que o pagamento é aprovado. Use o mesmo e-mail da compra.</p>
      <button class="btn accent" id="recarregar">Verificar de novo</button>
      <a class="btn ghost" href="#planos">Ver planos</a>
      <button class="btn ghost sm" id="sair">Sair</button></div></div>`;
    document.getElementById('recarregar').onclick=carregarAluno;
    document.getElementById('sair').onclick=sair;
    return;
  }
  if(!C){host.innerHTML='';return;}
  if(ass.ias.length===0){host.innerHTML=`<div class="wrap" style="padding-block:32px">${escolhaIAsHTML()}</div>`;ligarEscolha();return;}

  const done=ls('pt_done_'+email)||{};
  const aulas=C.aulas; let lesson=ls('pt_lesson_'+email)||aulas[0].id;
  const aula=aulas.find(a=>a.id===lesson)||aulas[0], idx=aulas.indexOf(aula);
  const feitas=aulas.filter(a=>done[a.id]).length, pct=Math.round(feitas/aulas.length*100);
  const mods=[...new Set(aulas.map(a=>a.modNum))];
  host.innerHTML=`<div class="wrap aluno">
    <aside class="side">
      <div class="panel" style="display:grid;gap:12px">
        <div class="me"><div class="avatar">${esc(email[0].toUpperCase())}</div><div style="min-width:0"><strong style="word-break:break-all">${esc(email)}</strong><div style="color:var(--ok);font-size:13px">Assinatura ${ass.status==='ativa'?'ativa':'cancelada'}</div></div></div>
        <div style="font-size:13px;color:var(--muted)">Curso: ${feitas} de ${aulas.length} aulas · ${pct}%</div>
        <div class="progress"><i style="width:${pct}%"></i></div>
      </div>
      <details class="panel lessons" ${matchMedia('(min-width:901px)').matches?'open':''}><summary><strong>Aulas do curso</strong></summary><nav aria-label="Aulas">${mods.map(n=>{const ax=aulas.filter(a=>a.modNum===n);return `<div class="mod"><h4>Módulo ${n} · ${esc(ax[0].mod)}</h4>${ax.map(a=>`<button class="lesson-btn ${done[a.id]?'done':''}" aria-current="${a.id===aula.id&&aTab==='aulas'}" data-l="${a.id}"><span class="dot"></span>${esc(a.t)}</button>`).join('')}</div>`}).join('')}</nav></details>
    </aside>
    <div style="min-width:0">
      <div class="welcome"><div><span class="eyebrow">Sua área Promptask</span><h2>Olá, ${esc(email.split('@')[0])}! O que vamos <span class="serif">criar</span> hoje?</h2></div>
        <div class="stats"><div><b>${iasLiberadas().length}</b>IAs liberadas</div><div><b>${iasLiberadas().length*C.modelos.length}</b>prompts</div><div><b>${feitas}/${aulas.length}</b>aulas feitas</div></div></div>
      <div class="atabs">${[['aulas','Aulas'],['prompts','Meus prompts'],['gerador','Gerador'],['conta','Minha assinatura']].map(([k,l])=>`<button class="tab" aria-selected="${aTab===k}" data-t="${k}">${l}</button>`).join('')}</div>
      <div id="aBody"></div>
    </div></div>`;
  const body=document.getElementById('aBody');
  if(aTab==='aulas'){
    body.innerHTML=`<article class="lesson panel"><span class="eyebrow">Aula ${idx+1} de ${aulas.length}</span><h2>${esc(aula.t)}</h2><div class="body">${aula.b}</div>
      <div class="nav"><button class="btn ghost sm" id="prevL" ${idx===0?'disabled':''}>Aula anterior</button>
      <button class="btn ${done[aula.id]?'ghost':'accent'} sm" id="doneL">${done[aula.id]?'Concluída ✓':'Marcar como concluída'}</button>
      <button class="btn ghost sm" id="nextL" ${idx===aulas.length-1?'disabled':''}>Próxima aula</button></div></article>`;
    document.getElementById('doneL').onclick=()=>{done[aula.id]=!done[aula.id];ls('pt_done_'+email,done);if(done[aula.id]&&idx<aulas.length-1)ls('pt_lesson_'+email,aulas[idx+1].id);areaRender();};
    document.getElementById('prevL').onclick=()=>{ls('pt_lesson_'+email,aulas[idx-1].id);areaRender();};
    document.getElementById('nextL').onclick=()=>{ls('pt_lesson_'+email,aulas[idx+1].id);areaRender();};
  } else if(aTab==='prompts'){
    const fora=IAS_PUB.filter(i=>!temIA(i.id));
    body.innerHTML=iasLiberadas().map(id=>{const ia=C.ias[id];return `<h3 style="margin:8px 0 12px;font-size:22px">${esc(ia.nome)} <span class="pill">${esc(ia.tipo)}</span></h3><p style="color:var(--muted);margin:0 0 14px">${ia.como}</p><div class="cards" style="margin-bottom:28px">${C.modelos.map(m=>`<div class="card"><h3>${esc(m.nome)}</h3><p>${esc(m.desc)}</p><button class="btn accent sm" data-ia="${id}" data-mod="${m.id}">Abrir no gerador</button></div>`).join('')}</div>`}).join('')
      + (fora.length?`<div class="panel" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><strong>Fora do seu plano:</strong> <span style="color:var(--muted)">${fora.map(i=>i.nome).join(', ')}</span></div><a class="btn ghost sm" href="#planos">Ver planos</a></div>`:'');
    body.onclick=e=>{const b=e.target.closest('[data-mod]');if(!b)return;gen.ia=b.dataset.ia;gen.mod=b.dataset.mod;aTab='gerador';areaRender();};
  } else if(aTab==='gerador'){
    body.innerHTML=`<div class="gen" id="genPriv"></div>`; genRender('genPriv');
  } else {
    const n=ass.plano_qtd, per=ass.periodo;
    body.innerHTML=`<div class="panel" style="display:grid;gap:12px;max-width:600px"><span class="eyebrow">Minha assinatura · <span style="color:var(--ok)">${ass.status==='ativa'?'ativa':'cancelada'}</span></span>
      <h2 style="font-size:28px">${n===4?'Todas as IAs':n+(n===1?' IA':' IAs')} · ${per} · ${brl(preco(n,per))}/${per==='mensal'?'mês':'ano'}</h2>
      <p style="margin:0">${ass.status==='ativa'?'Próxima renovação prevista até':'Assinatura cancelada. Seu acesso continua até'} <b>${dataBR(ass.pago_ate)}</b>.</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${iasLiberadas().map(id=>`<span class="pill">${esc(nomeIA(id))}</span>`).join('')}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${n<4?'<button class="btn accent sm" id="trocarIA">Trocar minhas IAs</button>':''}<button class="btn ghost sm" id="sair">Sair</button></div>
      <p style="color:var(--muted);font-size:14px;margin:0">Para cancelar ou mudar de plano, use o link de gerenciamento da assinatura que a Cakto enviou no e-mail da compra.</p></div>`;
    document.getElementById('sair').onclick=sair;
    const t=document.getElementById('trocarIA'); if(t) t.onclick=()=>{host.querySelector('#aBody').innerHTML=escolhaIAsHTML();ligarEscolha();};
  }
  host.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{aTab=b.dataset.t;areaRender();});
  host.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{ls('pt_lesson_'+email,b.dataset.l);aTab='aulas';areaRender();});
}
async function sair(){await sb.auth.signOut();sess=null;ass=null;C=null;hdr();location.hash='inicio';route();}

function hdr(){document.getElementById('hdrLogin').textContent=sess?'Minha área':'Área do aluno';}
function route(){
  const aluno=location.hash==='#aluno';
  document.getElementById('site').hidden=aluno; document.getElementById('area').hidden=!aluno;
  if(aluno){areaRender();window.scrollTo(0,0);}
}
const hdrEl=document.querySelector('header.top'), menuBtn=document.getElementById('menuBtn');
function fecharMenu(){hdrEl.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');menuBtn.setAttribute('aria-label','Abrir menu');}
menuBtn.addEventListener('click',()=>{const ab=!hdrEl.classList.contains('open');hdrEl.classList.toggle('open',ab);menuBtn.setAttribute('aria-expanded',String(ab));menuBtn.setAttribute('aria-label',ab?'Fechar menu':'Abrir menu');});
document.getElementById('mainNav').addEventListener('click',e=>{if(e.target.closest('a'))fecharMenu();});
window.addEventListener('hashchange',()=>{fecharMenu();route();});

// Volta do link de login: a página abre com ?aluno=1 e o Supabase lê o acesso do endereço
const veioDoLink = new URLSearchParams(location.search).has('aluno');

sb.auth.onAuthStateChange((evt,session)=>{
  const antes=sess&&sess.user.id; sess=session; hdr();
  if(session && veioDoLink && location.search){ history.replaceState(null,'',location.pathname+'#aluno'); route(); }
  if(session && session.user.id!==antes){ setTimeout(carregarAluno,0); }
  if(!session){ass=null;C=null; if(location.hash==='#aluno') areaRender();}
});

heroRender(); libRender(); plansRender(); hdr(); route();
