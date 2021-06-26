'use strict';
/*
  v1.03
*/
let ee = require('../services').ee;
let l  = require('../services').control_io;
let j  = require('../services').config;
let r  = require('../services').request;
let list_server = [];//lista de servidores



ee.on('CONTROLIO|clientIO', (err,list) => {
    ee.emit('LOG',Date.now(),'io',8,'CONTROLIO|clientIO',list);
    //console.log(list);
    list_server = list;
    list_server_update();
});


let list_server_update = ()=>{

    //recorremos todos los servidores que existen en la lista
    for ( let id in list_server){	
	let server = list_server[id];
	

	//creamos la conexion si no la tenemos creada
	if (! l.exist(server.id) ){
	    l.init(server.id);
	    ee.emit('LOG',Date.now(),'io',1,'server[',server.id,'] solicitando Token ','https://'+server.domain+':'+server.port+'/'+j.config.authorization.web);       
	    let req = r.post('https://'+server.domain+':'+server.port+'/'+j.config.authorization.web
			     ,{
				 rejectUnauthorized : false,
				 requestCert: false,
				 agent: false,
			     },(error,res,body)=>{
				 
	    			 if (error) {
				     l.disconnect(server.id);
				     return;
				 }
				 
				 let n = JSON.parse(body);
				 if( n.token === undefined){
				     l.disconnect(server.id);
				     return;
				 }
				 
				 ee.emit('LOG',Date.now(),'io',2,'server[',server.id,'] abriendo conexion');       
				 let sock = require('../services').ioclient('https://'+server.domain+':'+server.port,n.token);
		       		 
				 /*
				   -------------------------------------------------
				   functiones
				   -------------------------------------------------
				 */
				 let conn_function  = ()=>{
				     ee.emit('LOG',Date.now(),'io',2,'server[',server.id,'] conectado',server.domain);
				     l.active(server.id);
				 };
				 
				 let send_function = (req)=>{
				     /*
				       event_name: 'LOG',
				       dats: {
				       server_name : c.config.server_info.name,
				       name,
				       txtdata,
				       level
				       }
				     */
				     ee.emit('LOG',Date.now(),'io',99,'server[',server.id,'] send ',server.domain,req);
				     sock.emit('dats',req);
				 };
				 
				 let rx_function = (req)=>{
				     ee.emit('LOG',Date.now(),'io',99,'server[',server.id,'] recv ',server.domain,req);
				     ee.emit(req.event_name, req);
				 };
				 
				 let close_function = ()=>{
				     l.disconnect(server.id);
				     ee.off('CONTROL|send',send_function);
				     ee.off(sock.id,send_function);
				 };
				 let err_function = (err)=>{
				     ee.emit('LOG',Date.now(),'io',94,'server[',server.id,'] error ',server.domain,err);
				     close_function();
				 }
       				 
				 sock.on('connect', conn_function );
				 sock.on('connect_error', err_function );
				 sock.on('dats', rx_function );
				 
				 sock.on('disconnect', close_function );   
				 sock.on('close', close_function );	    
				 sock.on('error', close_function );
				 sock.on('connect_timeout',close_function );
				 
				 
				 ee.on('CONTROL|send',send_function);//multicast
				 ee.on(sock.id,send_function);//unicast

				 ee.emit('SUPERVISOR|start',sock.id);
				 
			     });
	    req.on('socket', function (socket) {
		socket.setTimeout(3000);  
		socket.on('timeout', function() {
		    ee.emit('LOG',Date.now(),'io',4,'server[',server.id,'] timeout ',server.domain);
                    l.disconnect(server.id);
		    req.abort();
		    return;
		});
	    });	    
	}
    }
};
