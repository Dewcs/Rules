/* GLOBALS */
var round=0; // current round
var cGrid=null; // current grid
var nGrid=null; // next grid   
var G_SIZE=6; // grid size
var w=800; // screen width
var h=800; // screen height
var ctx=null; // context
var rule_type = null; // rule mode
var rule_amount = null; // rule value
var rule_rounds = null; // rule rounds
var aRules = []; // available rules
var cRules = []; // current rules
var sRules = []; // dhadow rules
var result = null; // game result
var pStack = []; // process stack
var status = null; // game status
var diff = 0.8;
var wins = 0;
var loses=0;
var bdiff = 0.8;
var tid=0;

/* FUNCTIONS */
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function store() {
    localStorage.setItem("wins", wins);
    localStorage.setItem("loses", loses);
    localStorage.setItem("diff", diff);
    localStorage.setItem("bdiff", bdiff);
    if (!localStorage.getItem("uid")) localStorage.setItem("uid", randomHash());
    updateTop(localStorage.getItem("uid"),parseFloat(localStorage.getItem("bdiff")));
}

function load() {
    if (localStorage.getItem("wins")) wins=parseInt(localStorage.getItem("wins"));
    if (localStorage.getItem("loses")) loses=parseInt(localStorage.getItem("loses"));
    if (localStorage.getItem("diff")) diff=parseFloat(localStorage.getItem("diff"));
    if (localStorage.getItem("bdiff")) bdiff=parseFloat(localStorage.getItem("bdiff"));
    
}

function mapInt(val,min,max,rangea,rangeb) {
    var p=(val-min)/(max-min)*(rangeb-rangea)+rangea;
    return Math.round(p);
}
/* END FUNCTIONS */

function send() {
    var token=localStorage.getItem("uid");
    var score=bdiff;
    var name=document.getElementById("name").value;
    if (name.length<1 || name.length>10) {
        alert("Name between 1-10 letters");
        return ;
    }
    var xmlhttp=new XMLHttpRequest();;
    xmlhttp.onreadystatechange=function(token,score) {
        if (this.readyState==4 && this.status==200) {
            console.log(this.responseText);
            var data=JSON.parse(this.responseText);
            var html='<table id="highscores">';
            html += '<tr><th>Pos</th><th>Name</th><th>Score</th></tr>';
            for (var i=0; i<data.length; ++i) {
                if (data[i].uid==localStorage.getItem("uid")) {
                    html+='<tr><th style="text-align:center;">'+(i+1).toString()+'</th><th style="text-align:center;">'+data[i].name+'</th><th>'+Math.round(100-data[i].score*100).toString()+'</th></tr>';    
                } else {
                    html+='<tr><td style="text-align:center;">'+(i+1).toString()+'</td><td style="text-align:center;">'+data[i].name+'</td><td>'+Math.round(100-data[i].score*100).toString()+'</td></tr>';
                }  
            }
            html += '<tr><td colspan="3" style="border-top:1px solid white;"></td></tr>'
            html += '<tr><th><input type="button" value="Send" onclick="send()"></th><th style="text-align:center;"><input type="text" value="" id="name" size="10"></th><th>'+Math.round(100-bdiff*100).toString()+'</th></tr>';
            html += '</table>';
            document.getElementById("highscores").innerHTML=html;
        }
    }.bind(xmlhttp,token,score);
    xmlhttp.open("GET","set.php?u="+token+"&name="+name+"&score="+score+"&rnd"+Math.random().toString(),true);
    xmlhttp.send();
}

function updateTop(token,score) {
    var xmlhttp=new XMLHttpRequest();;
    xmlhttp.onreadystatechange=function(token,score) {
        if (this.readyState==4 && this.status==200) {
            var data=JSON.parse(this.responseText);
            console.log(data);
            var html='<table id="highscores">';
            html += '<tr><th style="text-align:center;">Pos</th><th style="text-align:center;">Name</th><th style="text-align:center;">Score</th></tr>';
            for (var i=0; i<data.length; ++i) {
                if (data[i].uid==localStorage.getItem("uid")) {
                    html+='<tr><th style="text-align:center;">'+(i+1).toString()+'</th><th style="text-align:center;">'+data[i].name+'</th><th style="text-align:center;">'+Math.round(100-data[i].score*100).toString()+'</th></tr>';    
                } else {
                    html+='<tr><td style="text-align:center;">'+(i+1).toString()+'</td><td style="text-align:center;">'+data[i].name+'</td><td style="text-align:center;">'+Math.round(100-data[i].score*100).toString()+'</td></tr>';
                }  
            }
            html += '<tr><td colspan="3" style="border-top:1px solid white;"></td></tr>'
            html += '<tr><th><input type="button" value="Send" onclick="send()"></th><th style="text-align:center;"><input type="text" value="" id="name" size="10"></th><th style="text-align:center;">'+Math.round(100-bdiff*100).toString()+'</th></tr>';
            html += '</table>';
            document.getElementById("highscores").innerHTML=html;
        }
    }.bind(xmlhttp,token,score);
    xmlhttp.open("GET","get.php?u="+token+"&rnd"+Math.random().toString(),true);
    xmlhttp.send();
}

function begin() {
    // attach events
    document.getElementById("game").onmouseup = click;
    ctx=document.getElementById("game").getContext("2d");
    load();
    store();
    updateTop(localStorage.getItem("uid"),bdiff)
    start();
}

// set random rules
function resetRules(grid,rules) {
    aRules = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    var next=calcNextRules(grid,calcNeighbors(grid),rules);
    for (var i=0; i<next.length; ++i) aRules[next[i]]=1;
}

// start a game
function start() {
    result="play";
    round=0;
    // set grid
    cGrid=[];
    for (var i=0; i<G_SIZE; ++i) {
        cGrid[i]=[];
        for (var j = 0; j<G_SIZE; ++j) {
            cGrid[i][j]=Math.round(Math.random());    
        }
    }
    // reset rules
    cRules = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    resetRules(cGrid,cRules);
    test();
    doBeginDraw();    
}

function setStatus(s) {
    status=s;
}

function clearStack() {
    for (var i=0; i<pStack.length; ++i) {
        clearTimeout(pStack[i]);
    }
    pStack=[];
}

function doBeginDraw() {
    pStack.push(setTimeout("setStatus('drawBegin');",1));
    for (var i=1; i<=50; ++i) {
        perc=i/50;
        pStack.push(setTimeout("drawGridBegin(cGrid,"+perc.toString()+")",Math.round(perc*1000)));
    }
    pStack.push(setTimeout("drawGame();",1001));
    pStack.push(setTimeout("setStatus('inGame');",1002));
    pStack.push(setTimeout("clearStack();",1003));
}

var rule_type_text = ["exactly","more than","less than"];

function countAlive(grid) {
    var sum=0;
    for (var i=0; i<G_SIZE; ++i) {
        for (var j = 0; j<G_SIZE; ++j) {
            sum+=grid[i][j];    
        }
    }
    return sum; 
}

function validScore(grid) {
    if (rule_type==0) return countAlive(grid)==rule_amount;
    else if (rule_type==1) return countAlive(grid)>rule_amount;
    else if (rule_type==2) return countAlive(grid)<rule_amount;
}

function drawText(text,x,y,color,font,align) {
    ctx.fillStyle=color;
    ctx.font=font;
    ctx.textAlign=(typeof align !== undefined)?align:"left";
    ctx.fillText(text,x,y);
}

function insideRect(x,y,rx,ry,w,h) {
    return ((x>=rx && x<=rx+w) && (y>=ry && y<=ry+h));
}

function click(e) {
    e = e || window.event;

    var target = e.target || e.srcElement,
    style = target.currentStyle || window.getComputedStyle(target, null),
    borderLeftWidth = parseInt(style['borderLeftWidth'], 10),
    borderTopWidth = parseInt(style['borderTopWidth'], 10),
    rect = target.getBoundingClientRect(),
    offsetX = e.clientX - borderLeftWidth - rect.left,
    offsetY = e.clientY - borderTopWidth - rect.top;
    if (tid<5) {
        ++tid;
        drawGame();    
    } else if (result=="play") {
        if (status=="drawBegin") {
            clearStack();
            drawGame();
            setStatus("inGame");
        } else if (status=="inGame" || status=="drawShadow") {
            var x=offsetX;
            var y=offsetY;
            var p=50;
            for (var i=0; i<cRules.length; ++i) {
                if (cRules[i]==1) {
                    if (insideRect(x,y,670,p,60,60)) {
                        if (countRules()>1) {
                            next(i);
                        } else alert("You can't remove all rules");    
                    }
                    p+=70;
                }
            }
            p+=50;
            if (countRules()<5) {
                for (var i=0; i<aRules.length; ++i) {
                    if (aRules[i]==1) {
                        if (insideRect(x,y,670,p,60,60)) {
                            if (countRules()<5) {
                                next(i);
                            } else alert("You can't have more than 5 rules");    
                        }
                        p+=70;
                    }
                }
            }
        } else if (status=="transitionBegin") {
            clearStack();
            cGrid=nGrid;
            drawGame();
            setStatus("inGame");
        }
    } else  {
        start();
    }
}

function calcNeighbors(grd) {
    var nei=makeMatrix(G_SIZE,0);
    for (var x = -1; x<=1; ++x) {
        var begini=Math.max(0,-x);
        var endi=Math.min(G_SIZE,G_SIZE-x);
        for (var y = -1; y<=1; ++y) {
            if (!(x==0 && y==0)) {
                var beginj=Math.max(0,-y);
                var endj=Math.min(G_SIZE,G_SIZE-y);
                for (var i=begini; i<endi; ++i) {
                    for (var j = beginj; j<endj; ++j) {
                        nei[i+x][j+y]+=grd[i][j];
                    }    
                }
            }  
        }
    }
    return nei;
}

function countRules() {
    var count=0;
    for (var i=0; i<cRules.length; ++i) {
        count+=cRules[i];
    }
    return count;
}

function valid(v,min,max) {
    return v>=min && v<=max;
}

function matchRule(r,a,n) {
    return (Math.floor(r/9)==a && n==r%9);
}

function makeMatrix(w,v) {
    var matrix=[];
    for (var i=0; i<w; ++i) {
        matrix[i]=[];
        for (var j = 0; j<w; ++j) {
            matrix[i][j]=v;    
        }
    }
    return matrix;
}

function next(id) {
    console.log("NEXT",id);
    ++round;
    if (cRules[id]) cRules[id]=0;
    else cRules[id]=1;
    nGrid=calcNext(cGrid,cRules);
    resetRules(nGrid,cRules);
    if (round==rule_rounds) {
        if (validScore(nGrid)) {
            result="win";
            ++wins;
            diff-=diff*0.1;
            if (diff<0.001) diff=0.001;
            if (bdiff>diff) bdiff=diff;
        } else {
            result="fail";
            ++loses;
            diff+=diff*0.1;
            if (diff>0.95) diff=0.95;
        }
        store();
    }
    pStack.push(setTimeout("setStatus('transitionBegin');",1));
    for (var i=1; i<=50; ++i) {
        perc=i/50;
        pStack.push(setTimeout("drawGridTransform(cGrid,nGrid,"+perc.toString()+")",Math.round(perc*700)));
    }
    pStack.push(setTimeout("cGrid=nGrid;drawGame();",701));
    pStack.push(setTimeout("setStatus('inGame');",702));
    pStack.push(setTimeout("clearStack();",703));
}

function calcNext(grd,rules) {
    var ngrid=makeMatrix(G_SIZE,0);
    var nei=calcNeighbors(grd);
    for (var i=0; i<G_SIZE; ++i) {
        for (var j = 0; j<G_SIZE; ++j) {
            for (var r=0; r<rules.length; ++r) {
                if (rules[r]==1 && matchRule(r,grd[i][j],nei[i][j])) {
                    ngrid[i][j]=1;
                }
            }    
        }
    }
    return ngrid;
}

var BORDER=4;
var BGCOLOR="#111";
var ALIVECOLOR="#EEE";
var DEADCOLOR="#666";
var ALIVETEXT="#666";
var DEADTEXT="#EEE";
var DEAD2ALIVE=["#666","#777","#888","#999","#AAA","#BBB","#CCC","#DDD","#EEE"];

function drawGridTransform(curr,targ,perc) {
    ctx.fillStyle=BGCOLOR;
    ctx.fillRect(0,0,600,600);
    var nei=null;
    if (perc<0.5) nei=calcNeighbors(curr);
    else nei=calcNeighbors(targ);
    for (var i=0; i<G_SIZE; ++i) {
        for (var j = 0; j<G_SIZE; ++j) {
            if (curr[i][j]) {
                if (targ[i][j]) {
                    ctx.fillStyle=ALIVECOLOR;
                    ctx.fillRect(BORDER+600/G_SIZE*j,BORDER+600/G_SIZE*i,600/G_SIZE-BORDER*2,600/G_SIZE-BORDER*2);
                    ctx.textBaseline="middle";
                    drawText(nei[i][j],1+600/G_SIZE*(j+0.5),1+600/G_SIZE*(i+0.5),curr[i][j]?ALIVETEXT:DEADTEXT,"60px Arial","center");
                } else {
                    ctx.fillStyle=DEAD2ALIVE[mapInt(1-perc,0,1,0,DEAD2ALIVE.length-1)];
                    ctx.fillRect(BORDER+600/G_SIZE*j,BORDER+600/G_SIZE*i,600/G_SIZE-BORDER*2,600/G_SIZE-BORDER*2);
                    ctx.textBaseline="middle";
                    drawText(nei[i][j],1+600/G_SIZE*(j+0.5),1+600/G_SIZE*(i+0.5),DEAD2ALIVE[mapInt(perc,0,1,0,DEAD2ALIVE.length-1)],"60px Arial","center");
                }
            } else {
                if (targ[i][j]) {
                    ctx.fillStyle=DEAD2ALIVE[mapInt(perc,0,1,0,DEAD2ALIVE.length-1)];
                    ctx.fillRect(BORDER+600/G_SIZE*j,BORDER+600/G_SIZE*i,600/G_SIZE-BORDER*2,600/G_SIZE-BORDER*2);
                    ctx.textBaseline="middle";
                    drawText(nei[i][j],1+600/G_SIZE*(j+0.5),1+600/G_SIZE*(i+0.5),DEAD2ALIVE[mapInt(1-perc,0,1,0,DEAD2ALIVE.length-1)],"60px Arial","center"); 
                } else {
                    ctx.fillStyle=DEADCOLOR;
                    ctx.fillRect(BORDER+600/G_SIZE*j,BORDER+600/G_SIZE*i,600/G_SIZE-BORDER*2,600/G_SIZE-BORDER*2);
                    ctx.textBaseline="middle";
                    drawText(nei[i][j],1+600/G_SIZE*(j+0.5),1+600/G_SIZE*(i+0.5),curr[i][j]?ALIVETEXT:DEADTEXT,"60px Arial","center");
                }
            }   
        }
    }    
}

function drawGridBegin(grid,perc) {
    ctx.fillStyle=BGCOLOR;
    ctx.fillRect(0,0,600,600);
    var total=countAlive(cGrid);
    var maxid=perc*(G_SIZE*G_SIZE)/0.9;
    for (var i=0; i<G_SIZE; ++i) {
        for (var j = 0; j<G_SIZE; ++j) {
            var id=i*G_SIZE+j;
            var idp=perc-(id/(G_SIZE*G_SIZE))*0.9;
            if (id<maxid) {
                if (grid[i][j]) {
                    ctx.fillStyle=ALIVECOLOR;
                } else {
                    ctx.fillStyle=DEADCOLOR;
                }
                if (idp>=0.125) ctx.fillRect(BORDER+600/G_SIZE*j,BORDER+600/G_SIZE*i,600/G_SIZE-BORDER*2,600/G_SIZE-BORDER*2);
                else {
                    var width=600/G_SIZE-BORDER*2;
                    var size=width*idp/0.125;
                    ctx.fillRect(BORDER+600/G_SIZE*j+(width-size)/2,BORDER+600/G_SIZE*i+(width-size)/2,size,size);
                }
            }    
        }
    }    
}
function drawGrid(grd) {
    ctx.fillStyle=BGCOLOR;
    ctx.fillRect(0,0,600,600);
    var nei=calcNeighbors(grd);
    for (var i=0; i<G_SIZE; ++i) {
        for (var j = 0; j<G_SIZE; ++j) {
            if (grd[i][j]) {
                ctx.fillStyle=ALIVECOLOR;
            } else {
                ctx.fillStyle=DEADCOLOR;
            }
            ctx.fillRect(BORDER+600/G_SIZE*j,BORDER+600/G_SIZE*i,600/G_SIZE-BORDER*2,600/G_SIZE-BORDER*2);
            ctx.textBaseline="middle";
            drawText(nei[i][j],1+600/G_SIZE*(j+0.5),1+600/G_SIZE*(i+0.5),grd[i][j]?ALIVETEXT:DEADTEXT,"60px Arial","center");   
        }
    }
}

function drawHeader(mode) {
    var objective="Get "+rule_type_text[rule_type]+" "+rule_amount.toString()+" alive cells in "+rule_rounds.toString()+" rounds";
    document.getElementById("objective").innerHTML=objective;
    if (mode==0) {
        var status = "<table id=\"status0\"><tr><td id=\"status1\">Current round: "+round.toString()+
        "<td><td id=\"status2\">&nbsp;</td></tr></table>";
        document.getElementById("status").innerHTML=status;
    } else {
        var status = "<table id=\"status0\"><tr><td id=\"status1\">Current round: "+round.toString()+
        "<td><td id=\"status2\">Current alive: "+((validScore(cGrid))?countAlive(cGrid).toString():"<span class='cred'>"+countAlive(cGrid).toString()+"</span>")+"</td></tr></table>";
        document.getElementById("status").innerHTML=status; 
    }   
}

function drawRule(r,x,y) {
    var alive=Math.floor(r/9);
    var w=60;
    var num=r%9;
    if (alive) {
        ctx.fillStyle=ALIVECOLOR;
    } else {
        ctx.fillStyle=DEADCOLOR;
    }
    ctx.fillRect(x-w/2,y,w,w);
    ctx.textBaseline="middle";
    drawText(num,x,y+w/2,alive?ALIVETEXT:DEADTEXT,"40px Arial","center");
}

function drawRules() {
    ctx.clearRect(600,0,200,600);
    var p=0;
    ctx.textBaseline="top";
    drawText("Current Rules",700,0,"#EEE","25px Arial","center");
    p+=50;
    for (var i=0; i<cRules.length; ++i) {
        if (cRules[i]==1) {
            drawRule(i,700,p);
            p+=70;
        }
    }
    ctx.textBaseline="top";
    drawText("Available Rules",700,p,"#EEE","25px Arial","center");
    p+=50;
    if (countRules()<5) {
        for (var i=0; i<aRules.length; ++i) {
            if (aRules[i]==1) {
                drawRule(i,700,p);
                p+=70;
            }
        }
    }
}

function drawGame() {
    drawStatistics();
    drawHeader(1);
    drawGrid(cGrid);
    drawRules();
    if (result=="win" || result=="fail") {
        if (result=="win") ctx.fillStyle="rgba(255,255,255,0.9)";
        else ctx.fillStyle="rgba(17,17,17,0.9)";
        ctx.fillRect(75,225,450,150);
        ctx.textBaseline="middle";
        var text="You win :D";
        if (result=="fail") text="You fail T_T";
        drawText(text,300,280,(result=="win")?DEADCOLOR:ALIVECOLOR,"50px Arial","center");
        drawText("Click to continue",300,350,(result=="win")?DEADCOLOR:ALIVECOLOR,"20px Arial","center");    
    } 
    if (tid==0) {
        // header
        ctx.beginPath();
        ctx.moveTo(300,0);
        ctx.lineTo(350,50);
        ctx.lineTo(325,50);
        ctx.lineTo(325,75);
        ctx.lineTo(525,75);
        ctx.lineTo(525,200);
        ctx.lineTo(75,200);
        ctx.lineTo(75,75);
        ctx.lineTo(275,75);
        ctx.lineTo(275,50);
        ctx.lineTo(250,50);
        ctx.closePath();
        ctx.fillStyle=ALIVECOLOR;
        ctx.fill();
        ctx.strokeStyle=BGCOLOR;
        ctx.stroke();
        drawText("Game objective",300,120,DEADCOLOR,"30px Arial","center");
        drawText("Round number",100,170,DEADCOLOR,"20px Arial","left");
        drawText("Alive cells count",500,170,DEADCOLOR,"20px Arial","right");   
    } else if (tid==1) {
        // grid
        ctx.beginPath();
        ctx.moveTo(75,75);
        ctx.lineTo(525,75);
        ctx.lineTo(525,375);
        ctx.lineTo(75,375);
        ctx.closePath();
        ctx.fillStyle=ALIVECOLOR;
        ctx.fill();
        ctx.strokeStyle=BGCOLOR;
        ctx.stroke();
        ctx.textBaseline="middle";
        drawText("Grid information",300,100,DEADCOLOR,"30px Arial","center");
        ctx.fillStyle=BGCOLOR;
        ctx.fillRect(100,130,100,100);
        ctx.fillStyle=ALIVECOLOR;
        ctx.fillRect(103,133,94,94);
        ctx.textBaseline="middle";
        drawText(1,150,180,ALIVETEXT,"60px Arial","center");
        drawText("-Alive cell",220,160,ALIVETEXT,"30px Arial","left");
        drawText("-1 alive cell nearby",220,200,ALIVETEXT,"30px Arial","left");
        ctx.fillStyle=BGCOLOR;
        ctx.fillRect(100,240,100,100);
        ctx.fillStyle=DEADCOLOR;
        ctx.fillRect(103,243,94,94);
        ctx.textBaseline="middle";
        drawText(4,150,290,DEADTEXT,"60px Arial","center");
        drawText("-Dead cell",220,270,ALIVETEXT,"30px Arial","left");
        drawText("-4 alive cell nearby",220,310,ALIVETEXT,"30px Arial","left");
    } else if (tid==2) {
        // rules
        ctx.beginPath();
        ctx.moveTo(650,90);
        ctx.lineTo(750,90);
        ctx.lineTo(750,310);
        ctx.lineTo(650,310);
        ctx.closePath();
        ctx.strokeStyle=ALIVECOLOR;
        ctx.lineWidth=5;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(700,310);
        ctx.lineTo(730,340);
        ctx.lineTo(715,340);
        ctx.lineTo(715,370);
        ctx.lineTo(750,370);
        ctx.lineTo(750,530);
        ctx.lineTo(150,530);
        ctx.lineTo(150,370);
        ctx.lineTo(670,370);
        ctx.lineTo(685,370);
        ctx.lineTo(685,340);
        ctx.lineTo(670,340);
        ctx.closePath();
        ctx.fillStyle=ALIVECOLOR;
        ctx.fill();
        ctx.lineWidth=1;
        ctx.strokeStyle=BGCOLOR;
        ctx.stroke();
        ctx.textBaseline="middle";
        drawText("Current rules: cells that will be alive after the round (click to remove)",170,400,ALIVETEXT,"18px Arial","left");
        drawText("You can have 5 rules active maximum and 1 minimum",170,425,ALIVETEXT,"18px Arial","left");
        drawText("Available rules: add one rule to current rules (click to add)",170,450,ALIVETEXT,"18px Arial","left");
        drawText("Everytime you add/remove a rule one turn will pass",170,475,ALIVETEXT,"18px Arial","left");
        drawText("REMEMBER all cells die by default",170,500,ALIVETEXT,"18px Arial","left");
    } else if (tid==3) {
        // stats
        ctx.beginPath();
        ctx.moveTo(0,140);
        ctx.lineTo(40,100);
        ctx.lineTo(40,120);
        ctx.lineTo(80,120);
        ctx.lineTo(80,50);
        ctx.lineTo(520,50);
        ctx.lineTo(520,225);
        ctx.lineTo(80,225);
        ctx.lineTo(80,160);
        ctx.lineTo(40,160);
        ctx.lineTo(40,180);
        //ctx.lineTo(670,340);
        ctx.closePath();
        ctx.fillStyle=ALIVECOLOR;
        ctx.fill();
        ctx.lineWidth=1;
        ctx.strokeStyle=BGCOLOR;
        ctx.stroke();
        ctx.textBaseline="middle";
        drawText("Wins: total number of wins",100,75,ALIVETEXT,"18px Arial","left");
        drawText("Loses: total number of loses",100,100,ALIVETEXT,"18px Arial","left");
        drawText("Rate: Win rate percentage",100,125,ALIVETEXT,"18px Arial","left");
        drawText("Difficulty: (0-100) current level of difficulty",100,150,ALIVETEXT,"18px Arial","left");
        drawText("Top Difficulty*: Highest difficulty achieved",100,175,ALIVETEXT,"18px Arial","left");
        drawText("*Top difficulty score is used for highscores",100,200,ALIVETEXT,"18px Arial","left");
    } else if (tid==4) {
        // highscores
        var y=250;
        ctx.beginPath();
        ctx.moveTo(0,140+y);
        ctx.lineTo(40,100+y);
        ctx.lineTo(40,120+y);
        ctx.lineTo(80,120+y);
        ctx.lineTo(80,50+y);
        ctx.lineTo(520,50+y);
        ctx.lineTo(520,225+y);
        ctx.lineTo(80,225+y);
        ctx.lineTo(80,160+y);
        ctx.lineTo(40,160+y);
        ctx.lineTo(40,180+y);
        //ctx.lineTo(670,340);
        ctx.closePath();
        ctx.fillStyle=ALIVECOLOR;
        ctx.fill();
        ctx.lineWidth=1;
        ctx.strokeStyle=BGCOLOR;
        ctx.stroke();
        ctx.textBaseline="middle";
        drawText("Here you can see the TOP10 scores",100,75+y,ALIVETEXT,"18px Arial","left");
        drawText("To upload your score:",100,100+y,ALIVETEXT,"18px Arial","left");
        drawText("-Type your name inside the box (1-10 letters)",100,125+y,ALIVETEXT,"18px Arial","left");
        drawText("-Click \"Send\" button",100,150+y,ALIVETEXT,"18px Arial","left");
        drawText("",100,175+y,ALIVETEXT,"18px Arial","left");
        drawText("Have fun!",100,200+y,ALIVETEXT,"18px Arial","left");
    }
}

function calcNextRules(grid,nei,rules) {
    var tmp = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for (var i=0; i<G_SIZE; ++i) {
        for (var j=0; j<G_SIZE; ++j) {
            var res=nei[i][j];
            if (grid[i][j]) res+=9;
            ++tmp[res];
        }
    }
    var ret=[];
    for (var t=0; t<3; ++t) {
        b=-1;
        for (var i=0; i<tmp.length; ++i) {
            if (rules[i]==0 && (b==-1||tmp[i]>tmp[b])) {
                b=i;    
            }
        }
        tmp[b]=-1;
        ret.push(b);
    }
    return ret; 
} 

function rec(grid,rules,lvl,max,stats) {
    if (lvl==max) {
        ++stats[countAlive(grid)];    
    } else {
        var nei=calcNeighbors(grid);
        var next=calcNextRules(grid,nei,rules);
        var c=rules.reduce(function(a, b) {return a + b;});
        for (var i=0; i<rules.length; ++i) {
            if (rules[i]==1 || (c<5 && next.indexOf(i)!=-1)) {
                rules[i]=rules[i]?0:1;
                var ngrid=calcNext(grid,rules);
                rec(ngrid,rules,lvl+1,max,stats);
                rules[i]=rules[i]?0:1;
            }
        }
    }
}

function test() {
    rule_rounds=getRandomInt(5,7);
    var begin=Date.now();
    var depth=rule_rounds;
    var stats=[];
    var rules = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for (var i=0; i<=G_SIZE*G_SIZE; ++i) stats[i]=0;
    rec(cGrid,rules,0,depth,stats);
    console.log("DONE IN",Date.now()-begin,stats);
    // set rules
    // make stats chart
    var chart=[];
    var total=stats.reduce(function(a, b) {return a + b;});
    // equal
    for (var j=0; j<stats.length; ++j) {
        chart[j]=stats[j]/total;        
    }
    // more than
    var sum=0;
    for (var j=stats.length-1; j>=0; --j) {
        chart[j+stats.length]=sum/total;
        sum+=stats[j];       
    }
    // less than
    var sum=0;
    for (var j=0; j<stats.length; ++j) {
        chart[j+stats.length*2]=sum/total;
        sum+=stats[j];        
    }
    var b=-1;
    var bv=0
    for (var i=0; i<chart.length; ++i) {
        var value=Math.abs(diff-chart[i]);
        if (b==-1 || value<bv) {
            b=i;
            bv=value;
        }
    }
    rule_type=Math.floor(b/stats.length);
    rule_amount=b%stats.length;
    drawHeader(0);
}

function drawStatistics() {
    document.getElementById("swin").innerHTML=wins;
    document.getElementById("sloss").innerHTML=loses;
    document.getElementById("srate").innerHTML=((loses+wins==0)?"0":Math.round(wins/(loses+wins)*100))+" %";
    document.getElementById("sdiff").innerHTML=Math.round(100-Math.round(diff * 100));
    document.getElementById("sbdiff").innerHTML=Math.round(100-Math.round(bdiff * 100)); 
}

function randomHash() {
    var ret='';
    var str='0123456789ABCDEF';
    for (var i=0; i<40; ++i) {
        var pos=getRandomInt(0,15);
        ret+=str.substring(pos,pos+1);
    }
    return ret; 
}