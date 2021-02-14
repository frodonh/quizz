var questions;
var game;
const colors=["var(--palettea)","var(--paletteb)","var(--palettec)","var(--paletted)","var(--palettee)","var(--palettef)"];
const ncolors=["Bleus","Verts","Fuchsia","Orange","Gris"];

function reset_button(slide) {
	let button=slide.getElementsByTagName('button')[0];
	button.classList.remove('done');
	button.disabled=false;
}

function reset_answers(event) {
	let xhttp=new XMLHttpRequest();
	let button=event.currentTarget;
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=() => button.classList.add('done');
	xhttp.send('reset='+game);
	button.disabled=true;
}

function enter_current(slide) {
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.send('set='+slide.dataset['question']+'&game='+game);
}

function exit_current(slide) {
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.send('set=NULL&game='+game);
}

function create_pie(byanswer,total) {
	const stot=100*2*Math.PI;
	let gpie=document.createElementNS('http://www.w3.org/2000/svg','g');
	gpie.setAttribute('transform','translate(200 200)');
	let scur=0.0;
	let sprev=0.0;
	let numslice=0;
	for (let i=0;i<byanswer.length;++i) if (byanswer[i]>0) {
		numslice++;
		let slice=document.createElementNS('http://www.w3.org/2000/svg','circle');
		sprev+=scur;
		scur=(byanswer[i]/total)*stot;
		slice.setAttribute("cx","0");
		slice.setAttribute("cy","0");
		slice.setAttribute("r","100");
		slice.style.strokeWidth="200";
		slice.style.stroke=colors[i];
		slice.style.fill="none";
		slice.style.animation="3s ease-in-out 0s 1 normal both running pies";
		if (numslice==0) slice.style.strokeDasharray=''+scur+' '+(stot-scur)+' 0 0';
		else if (stot-sprev-scur<0.1) slice.style.strokeDasharray='0 '+sprev+' '+scur+' 0';
		else slice.style.strokeDasharray='0 '+sprev+' '+scur+' '+(stot-sprev-scur);
		gpie.appendChild(slice);
	}
	return gpie;
}

function display_stats(slide) {
	const question=questions.find(x=>x['cd_question']==slide.dataset['question']);
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function() {
		const answers=JSON.parse(this.responseText);
		if (!answers) return;
		const num=question['options'].length;
		let div=slide.getElementsByClassName('scorequestion')[0];
		div.innerHTML='';
		// General pie
		let gpiediv=document.createElement('div');
		let gpiesvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
		gpiesvg.style.width="100%";
		gpiesvg.setAttribute('viewBox','0 0 400 400');
		gpiesvg.setAttribute('preserveAspectRatio','xMidYMid meet');
		let byanswer=new Array(num).fill(0);
		let total=0;
		for (const answer of answers) {
			const val=parseInt(answer['nombre']);
			byanswer[parseInt(answer['answer'])]+=val;
			total+=val;
		}
		let gpie=create_pie(byanswer,total);
		gpiesvg.appendChild(gpie);
		gpiediv.appendChild(gpiesvg);
		// Per-team pies
		let tpiediv=document.createElement('div');
		let numteams=0;
		for (const answer of answers) if (parseInt(answer['equipe'])>numteams) numteams=parseInt(answer['equipe']);
		numteams++;
		for (let j=0;j<numteams;++j) {
			let tpiesvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
			tpiesvg.style.width="45%";
			tpiesvg.style.maxHeight="25vh";
			tpiesvg.setAttribute('viewBox','0 0 400 500');
			tpiesvg.setAttribute('preserveAspectRatio','xMidYMid meet');
			byanswer=new Array(num).fill(0);
			total=0;
			for (const answer of answers) if (parseInt(answer['equipe'])==j) {
				const val=parseInt(answer['nombre']);
				byanswer[parseInt(answer['answer'])]+=val;
				total+=val;
			}
			let tpie=create_pie(byanswer,total);
			let text=document.createElementNS('http://www.w3.org/2000/svg','text');
			Object.assign(text.style,{'textAnchor':'middle','dominantBaseline':'middle','fill':colors[j],'font-size':'50px','font-weight':'bold'});
			text.setAttribute('x','0');
			text.setAttribute('y','240');
			text.textContent=ncolors[j];
			tpie.appendChild(text);
			tpiesvg.appendChild(tpie);
			tpiediv.appendChild(tpiesvg);
		}
		// Legend
		let legenddiv=document.createElement('div');
		let table=document.createElement('table');
		for (let i=0;i<num;++i) {
			let entry=document.createElement('tr');
			if (i==question['right_answer']) entry.dataset['fragment']='{"1":["goodanswer"]}';
			let tda=document.createElement('td');
			let colordiv=document.createElement('div');
			colordiv.style.backgroundColor=colors[i];
			tda.appendChild(colordiv);
			entry.appendChild(tda);
			let tdb=document.createElement('td');
			tdb.innerHTML=question['options'][i];
			entry.appendChild(tdb);
			table.appendChild(entry);
		}
		legenddiv.appendChild(table);
		// Add elements
		div.appendChild(gpiediv);
		div.appendChild(legenddiv);
		div.appendChild(tpiediv);
	};
	xhttp.send('stats-answer='+question['cd_question']+'&game='+game);
}

function display_hof(slide) {
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function() {
		// Prepare data
		const answers=JSON.parse(this.responseText);
		if (!answers) return;
		const scores=answers.map(x=>parseInt(x));
		let minscore=0;
		let maxscore=0;
		for (const score of scores) {
			if (score<minscore) minscore=score;
			if (score>maxscore) maxscore=score;
		}
		let ppp=380/(maxscore-minscore);
		let gety=(val)=>(390-ppp*(val-minscore));
		let svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
		svg.style.width="100%";
		svg.setAttribute('viewBox','0 0 700 400');
		svg.setAttribute('preserveAspectRatio','xMidYMid meet');
		// Axis
		let xaxis=document.createElementNS('http://www.w3.org/2000/svg','line');
		xaxis.setAttribute('x1','50');
		xaxis.setAttribute('y1','390');
		xaxis.setAttribute('x2','50');
		xaxis.setAttribute('y2','10');
		xaxis.style.stroke='var(--palettea)';
		svg.appendChild(xaxis);
		let yaxis=document.createElementNS('http://www.w3.org/2000/svg','line');
		let yzero=gety(0);
		yaxis.setAttribute('x1','50');
		yaxis.setAttribute('y1',''+yzero);
		yaxis.setAttribute('x2','700');
		yaxis.setAttribute('y2',''+yzero);
		yaxis.style.stroke='var(--palettea)';
		svg.appendChild(yaxis);
		let grad=Math.pow(10,Math.trunc(Math.log10((maxscore-minscore)/2.5)));
		let i=Math.floor(maxscore/grad);
		while (i*grad>=minscore) {
			let gline=document.createElementNS('http://www.w3.org/2000/svg','line');
			let gy=gety(i*grad);
			gline.setAttribute('x1','47');
			gline.setAttribute('y1',''+gy);
			gline.setAttribute('x2','50');
			gline.setAttribute('y2',''+gy);
			gline.style.stroke='var(--palettea)';
			svg.appendChild(gline);
			let gtext=document.createElementNS('http://www.w3.org/2000/svg','text');
			gtext.setAttribute('x','45');
			gtext.setAttribute('y',''+gy);
			Object.assign(gtext.style,{'textAnchor':'end','dominantBaseline':'middle','fill':'var(--palettea)','font-size':'12px'});
			gtext.textContent=''+(i*grad);
			svg.appendChild(gtext);
			--i;
		}
		// Display score bars
		let width=650/(scores.length);
		for (i=0;i<scores.length;++i) {
			let bar=document.createElementNS('http://www.w3.org/2000/svg','rect');
			bar.setAttribute('x',''+(80+width*i));
			bar.setAttribute('width',''+(width-30));
			let ybar=gety(scores[i]);
			if (scores[i]>0) {
				bar.setAttribute('y',''+ybar); 
				bar.setAttribute('height',''+(yzero-ybar)); 
			} else {
				bar.setAttribute('y',''+yzero);
				bar.setAttribute('height',''+(ybar-yzero));
			}
			bar.style.fill=colors[i];
			bar.style.stroke='none';
			bar.style.transformOrigin='0px '+yzero+'px';
			bar.style.animation='2s ease-in-out '+(200*i)+'ms 1 normal both running kfbars';
			bar.style.animationDelay=(200*i)+'ms';
			let text=document.createElementNS('http://www.w3.org/2000/svg','text');
			text.setAttribute('x',''+(80+width*i+(width-30)/2));
			text.textContent=''+scores[i];
			if (scores[i]>0) text.setAttribute('y',''+(ybar+10)); else text.setAttribute('y',''+(ybar-10));
			Object.assign(text.style,{'textAnchor':'middle','dominantBaseline':'middle','fill':'white','font-size':'12px','stroke':'none','font-weight':'bold','animation':'0.2s ease-out '+(0.2*i+2)+'s 1 normal both running kfappear'});
			svg.appendChild(bar);
			svg.appendChild(text);
		}
		// Add elements
		let div=slide.getElementsByClassName('content')[0];
		div.innerHTML='';
		div.appendChild(svg);
	};
	xhttp.send('stats-teams='+game);
}

function display_best(slide) {
	// Signal all participants the game has ended so that their screen displays their score
	let xhttp2=new XMLHttpRequest();
	xhttp2.open('POST','quizz.php',true);
	xhttp2.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp2.send('set=-1&game='+game);
	// Get podium
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function() {
		// Prepare data
		const best=JSON.parse(this.responseText);
		if (!best) return;
		for (let i=0;i<3;++i) {
			if (best.length<=i) break;
			let tex=document.getElementById('podium'+(i+1));
			let s='';
			for (const nom of best[i]["noms"]) {
				s=s+nom+'<br/>';
			}
			tex.innerHTML=s;
			let pts=document.getElementById('points'+(i+1));
			pts.textContent=best[i]["score"]+' points';
		}
	};
	xhttp.send('best-agents='+game);
}

function onSlidesStart(resolve,reject) {
	// Read query string
	let querys=decodeURI(location.search.substr(1)).split('&');
	let parameters=[];
	for (let i=0;i<querys.length;++i) {
		let varval=querys[i].split('=');
		parameters[varval[0]]=varval[1];
	}
	game='1';
	if ('game' in parameters && parameters['game']!='') game=parameters['game'];
	// QR-Code
	let uri=window.location.protocol+'//'+window.location.hostname+window.location.pathname.replace(/(.*)\/[^/]*$/,'$1/qpc.htm')+'?game='+game;
	let encodeduri=encodeURIComponent(uri);
	let qr=document.getElementById('qrcode');
	qr.innerHTML='<p style="text-align:center">Jouez sur : <a href="'+uri+'">'+uri+'</a></p><figure class="centered" style="width:80vw; height:70vh; margin: 20px auto"><img src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data='+encodeduri+'" style="max-width: 100%; height:100%" /></figure>';
	// Load questions
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function() {
		let podslide=document.getElementById('scores');
		// Add questions
		let quizz=JSON.parse(this.responseText);
		document.querySelector('[data-variable="subtitle"]').innerHTML=quizz['name'];
		questions=quizz['questions'];
		for (const question of questions) {
			// Question
			let slide=document.createElement('section');
			slide.dataset['onshow']='enter_current';
			slide.dataset['onhide']='exit_current';
			slide.dataset['question']=question['cd_question'];
			slide.dataset['numfragment']=''+(question['options'].length);
			let title=document.createElement('h1');
			title.innerHTML=question['question'];
			slide.appendChild(title);
			let content=document.createElement('div');
			content.classList.add('qcontent');
			if ('media' in question && question['media']!=null && question['media']!='') {
				content.classList.add('withcontent');
				let media=document.createElement('div');
				media.classList.add('media');
				media.innerHTML=question['media'];
				content.appendChild(media);
			}
			let options=document.createElement('div');
			options.classList.add('options');
			for (let j=0;j<question['options'].length;++j) {
				let div=document.createElement('div');
				div.classList.add('option');
				div.dataset['fragment']="{'0-"+j+"':['invisible']}";
				let innerdiv=document.createElement('div');
				innerdiv.innerHTML=question['options'][j];
				div.appendChild(innerdiv);
				options.appendChild(div);
			}
			content.appendChild(options);
			slide.appendChild(content);
			document.body.insertBefore(slide,podslide);
			// Explaination
			if (question["explain"] && question['explain']!=null && (question["explain"]["text"] || question["explain"]["media"] || question["explain"]["link"])) {
				slide=document.createElement('section');
				title=document.createElement('h1');
				title.innerHTML=question['question'];
				slide.appendChild(title);
				let content=document.createElement('div');
				content.classList.add('content');
				let block=document.createElement('div');
				block.classList.add("block");
				let btitle=document.createElement("h1");
				btitle.innerHTML=question["options"][question["right_answer"]];
				block.appendChild(btitle);
				if (question["explain"]["text"]) {
					let bcontent=document.createElement("div");
					bcontent.classList.add('content');
					bcontent.innerHTML=question["explain"]["text"];
					block.appendChild(bcontent);
				}
				content.appendChild(block);
				if (question["explain"]["link"] && question["explain"]["link"]!='') {
					let p=document.createElement('p');
					p.style.textAlign="center";
					p.innerHTML='<a target="_blank" href="'+question["explain"]["link"]+'">'+question["explain"]["link"]+'<a>';
					content.appendChild(p);
				}
				if (question["explain"]["media"] && question["explain"]["media"]!='') {
					let fig=document.createElement('figure');
					fig.classList.add('centered');
					fig.innerHTML=question["explain"]["media"];
					content.appendChild(fig);
				}
				slide.appendChild(content);
				document.body.insertBefore(slide,podslide);
			}
			// Statistics
			slide=document.createElement('section');
			slide.dataset['question']=question['cd_question'];
			slide.dataset['numfragment']='1';
			slide.dataset['onshow']='display_stats';
			title=document.createElement('h1');
			title.innerHTML=question['question'];
			slide.appendChild(title);
			content=document.createElement('div');
			content.classList.add('scorequestion');
			slide.appendChild(content);
			document.body.insertBefore(slide,podslide);
		}
		resolve();
	}
	xhttp.send('get_quizz='+game);
}
