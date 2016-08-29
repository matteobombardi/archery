$.ajaxSetup ({
    // Disable caching of AJAX responses
    cache: false
});

var svg = Array();
const MAX_PLAYERS = 4;
	
	function setColor(n) {
		n=parseInt(n);
		if (n >= 9) return 'color: #c8c800;	 font-weight: bold';
		if (n >= 7) return 'color: red;		 font-weight: bold';
		if (n >= 5) return 'color: blue;	 font-weight: bold';
		if (n >= 3) return 'color: black;	 font-weight: bold';
		return "";
	}
	
	function showScoreboard(tournamentId, loop){
	
		console.log('loop: ' + loop);
	
		var tempScrollTop = $(window).scrollTop();

		$.getJSON('/getTournamentData/'+tournamentId, function (scores) {
			
			var colWidth = (12/scores.length-1);
			
			// sort for order //
			scores.sort(function(a,b){
			  if (a.date < b.date)
				return -1;
			  if (a.date > b.date)
				return 1;
			  return 0;
			});
			
			// sort for score //
			var scoresSorted = scores.slice(0); // clone
			scoresSorted.sort(function(a,b){
			  if (parseInt(a.score) < parseInt(b.score))
				return 1;
			  if (parseInt(a.score) > parseInt(b.score))
				return -1;
			  return 0;
			});
			
			console.log(scoresSorted);

			var nPlayers = Math.min(scores.length,MAX_PLAYERS)
			for (i=0; i<nPlayers; i++){ 
				if (i>MAX_PLAYERS) break; // break on players overflow
			
				var html = '';
				
				
				
				//$('#scoreboard'+i).css("width:", ''+(100/scores.length)+'%');
				$('#scoreboard'+i).html(html);
				$('#scoreboard'+i).attr('class','fh5co-card scoreboard');
				$('#scoreboard'+i).css('padding',0);
				$('#scoreboard'+i).css('padding-top','30px');
				$('#scoreboard'+i).css('padding-bottom','30px');
				

				//html += '<div id="scoreboard'+i+'"  class="" >';
	
					html += '<h4 class="margin-lr">'+scores[i].user+' ('+scores[i].score+'/'+scores[i].max+')</h4>';
					
					if (scoresSorted[0]._id == scores[i]._id)
						html += '<img src="/images/gold.png" class="medal">';
					else if (scoresSorted[1]._id == scores[i]._id)
						html += '<img src="/images/silver.png" class="medal">';
					else if (scoresSorted[2]._id == scores[i]._id)
						html += '<img src="/images/bronze.png" class="medal">';
				
					html += '<div id="bgimg'+i+'" class="bgimg"  >';
						html += '<div id="target'+i+'" class="target" ></div>';		
					html += '</div>';
					
					
				
				/////// add target //////
				
				$('#scoreboard'+i).html(html);
				
				
				html='';
				var target = document.getElementsByClassName('target');
				target=target[i];
				
				
				svg[i] = document.createElementNS("http://www.w3.org/2000/svg", "svg");
				svg[i].style.width='100%';
				svg[i].style.height='100%';
				
				
				
				svg[i].id="svg"+i;
				target.appendChild(svg[i]);
				
				
				
				html += '<div class="margin-lr scoreboard-table"><table class="scoreboard">';
				html += '<tr class="scoreboard"> <th class="scoreboard">*</th> <th class="scoreboard">N1</th> <th class="scoreboard">N2</th> <th class="scoreboard">N3</th> <th class="scoreboard">AVG</th> <th class="scoreboard">TOT</th> </tr>';
				
				
				
				console.log('init');
				
				var totPlayer=0;

				//console.log(scores[i].volleies.length);
				
				
				for (j=0; j<scores[i].volleies.length; j++){ 
				
					var volley = scores[i].volleies[j].arrows;
					//console.log(j);
				
					/// TARGET ///
					for(ii=0; ii<volley.length; ii++){
						drawDot(volley[ii].x,volley[ii].y,"blue",i);
					}
					
					
					/// SCOREBOARD ///
	
					var tot = parseInt(volley[0].score) + parseInt(volley[1].score) + parseInt(volley[2].score);
					var avg = (tot/3).toFixed(1);
					
					totPlayer+=tot;
					
					//console.log(volley);
					
					html +=  '<tr class="scoreboard"> <td class="scoreboard">' + (j+1) + '</td>';
					
					
					html +=  '<td class="scoreboard"> <span style=" ' + setColor(volley[0].score) + '" >' + volley[0].score + '</span></td>';
					html +=  '<td class="scoreboard"> <span style=" ' + setColor(volley[1].score) + '" >' + volley[1].score + '</span></td>';
					html +=  '<td class="scoreboard"> <span style=" ' + setColor(volley[2].score) + '" >' + volley[2].score + '</span></td>';
					
					html +=  '<td class="scoreboard"> <span style=" ' + setColor(avg) + '">' + avg + '</span></td>';
					html +=  '<td class="scoreboard"> <span style=" ' + setColor(avg) + '">' + tot + '</span></td>';
					
					html +=  '</tr>';
				
				}  
				
				var avgPlayer = (totPlayer / (scores[i].volleies.length * 3)).toFixed(1);
				
				html +=  '<tr class="scoreboard"><td class="scoreboard" colspan=4> </td>';
				html +=	 '<td class="scoreboard"> <span style=" ' + setColor(avgPlayer) + '"> '+avgPlayer+'</span></td> ';
				html +=	 '<td class="scoreboard"> <span style=" ' + setColor(avgPlayer) + '"> '+totPlayer+'</span></td> ';
				
				html +=  '</tr>';
				
				html +=  '</table>';
				
				
				html +=  '</div>';
				
				
				$('#scoreboard'+i).append(html);
				$(window).scrollTop(tempScrollTop);
				
				//$('#totalScore').html(totPlayer+'/'+(scores[i].volleies.length * 3));
			}
			
			
			for (i=nPlayers; i < MAX_PLAYERS; i++ ){
				html='';
				
				html += '<h5>Scoreboard</h5><p>Leggi il QRCode per partecipare</p>';
				html += '<hr><img src="/qr/'+tournamentId+'" alt="'+tournamentId+'"  class="arcscb-qrcode"><hr>';
				
				$('#scoreboard'+i).html(html);
				$('#scoreboard'+i).attr('class','fh5co-card scoreboard');
			}

			if (loop) setTimeout(function(){showScoreboard(tournamentId,true)}, 1000);
			
			
		});
	}
	
	
	
	function showSessionScoreboard(sessionId,loop){
	
		var tempScrollTop = $(window).scrollTop();

		$.getJSON('/getSessionData/'+sessionId, function (scores) {
			
			var colWidth = (12/scores.length-1);

				var html = '';
				var i = 0;

				//$('#scoreboard'+i).css("width:", ''+(100/scores.length)+'%');
				$('#scoreboard'+i).html(html);
				$('#scoreboard'+i).attr('class','fh5co-card scoreboard');
				$('#scoreboard'+i).css('padding',0);
				$('#scoreboard'+i).css('padding-top','30px');
				$('#scoreboard'+i).css('padding-bottom','30px');
				$('#scoreboard'+i).css('width','80%');

				//html += '<div id="scoreboard'+i+'"  class="" >';
	
					html += '<h4 class="margin-lr">'+scores[i].user+' ('+scores[i].score+'/'+scores[i].max+')</h4>';
					html += '<div id="bgimg'+i+'" class="bgimg float-left">';
						html += '<div id="target'+i+'" class="target" ></div>';		
					html += '</div><br>';
					
					
				
				/////// add target //////
				
				$('#scoreboard'+i).html(html);
				
				
				html='';
				var target = document.getElementsByClassName('target');
				target=target[i];
				
				
				svg[i] = document.createElementNS("http://www.w3.org/2000/svg", "svg");
				svg[i].style.width='100%';
				svg[i].style.height='100%';
				
				
				
				svg[i].id="svg"+i;
				target.appendChild(svg[i]);
				
				
				
				html += '<div class="margin-lr"><table class="scoreboard  float-right">';
				html += '<tr class="scoreboard"> <th class="scoreboard">*</th> <th class="scoreboard">N1</th> <th class="scoreboard">N2</th> <th class="scoreboard">N3</th> <th class="scoreboard">AVG</th> <th class="scoreboard">TOT</th> </tr>';
				
				
				
				console.log('init');
				
				var totPlayer=0;

				//console.log(scores[i].volleies.length);
				
				
				for (j=0; j<scores[i].volleies.length; j++){ 
				
					var volley = scores[i].volleies[j].arrows;
					//console.log(j);
				
					/// TARGET ///
					for(ii=0; ii<volley.length; ii++){
						drawDot(volley[ii].x,volley[ii].y,"blue",i);
					}
					
					
					/// SCOREBOARD ///
	
					var tot = parseInt(volley[0].score) + parseInt(volley[1].score) + parseInt(volley[2].score);
					var avg = (tot/3).toFixed(1);
					
					totPlayer+=tot;
					
					//console.log(volley);
					
					html +=  '<tr class="scoreboard"> <td class="scoreboard">' + (j+1) + '</td>';
					
					
					html +=  '<td class="scoreboard"> <span style=" ' + setColor(volley[0].score) + '" >' + volley[0].score + '</span></td>';
					html +=  '<td class="scoreboard"> <span style=" ' + setColor(volley[1].score) + '" >' + volley[1].score + '</span></td>';
					html +=  '<td class="scoreboard"> <span style=" ' + setColor(volley[2].score) + '" >' + volley[2].score + '</span></td>';
					
					html +=  '<td class="scoreboard"> <span style=" ' + setColor(avg) + '">' + avg + '</span></td>';
					html +=  '<td class="scoreboard"> <span style=" ' + setColor(avg) + '">' + tot + '</span></td>';
					
					html +=  '</tr>';
				
				}  
				
				var avgPlayer = (totPlayer / (scores[i].volleies.length * 3)).toFixed(1);
				
				html +=  '<tr class="scoreboard"><td class="scoreboard" colspan=4> </td>';
				html +=	 '<td class="scoreboard"> <span style=" ' + setColor(avgPlayer) + '"> '+avgPlayer+'</span></td> ';
				html +=	 '<td class="scoreboard"> <span style=" ' + setColor(avgPlayer) + '"> '+totPlayer+'</span></td> ';
				
				html +=  '</tr>';
				
				html +=  '</table>';
				
				
				html +=  '</div>';
				
				
				$('#scoreboard'+i).append(html);
				$(window).scrollTop(tempScrollTop);
				
				//$('#totalScore').html(totPlayer+'/'+(scores[i].volleies.length * 3));
			
			


			if (loop) setTimeout(function(){showSessionScoreboard(sessionId,true)}, 1000);
			
			
		});
	}
	
	
	function drawDot(x,y,color,i){
	
		var ratio = getRatio(i);
		var svgNS = svg[i].namespaceURI;
		
		//console.log(svg[i]);

		var dot = document.createElementNS(svgNS,'circle');
		dot.setAttribute('cx',x/ratio);
		dot.setAttribute('cy',y/ratio);
		dot.setAttribute('r',3.5);
		dot.setAttribute('fill',color);
		dot.setAttribute('lineWidth',1);
		dot.setAttribute('stroke','gray');

		svg[i].appendChild(dot);
	
	}
	
	
	function getRatio(i){
		var imgbg = document.getElementsByClassName('bgimg')[i];
		var size = Math.min(imgbg.clientWidth,imgbg.clientHeight);
		var ratio = 100/size;

		return ratio;
	}