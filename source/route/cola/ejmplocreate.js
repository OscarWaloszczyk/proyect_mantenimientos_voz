'use strict';

let f  = require('../../../services').functions;
let ee = require('../../../services').ee;

const service        = 'createCampain';
const name           = '/automarcador/V1/createCampain';//debe de ser unico, por metodo
const arguments_body = {'company'      : 'string'
			,'name'        : 'string'
			,'type'        : 'integer'
			,'state'       : 'integer'
			,'ring'        : 'integer'
			,'max_contact' : 'integer'
			,'ddi'         : 'integer'
			,'queue'       : 'string'
			,'date_ini'    : 'date'
			,'date_end'    : 'date'
			,'callBackTime': 'time'
		       };

module.exports = function(router){
    try{
	router.post(name, (req,res)=>{
	    
	    const actionid   = f.actionIDGenerator();
	    const eventNames = name+actionid;
	    
	    let funt_response = (data,res)=>{
		f.router_close(eventNames,funt_response);
		f.responsePost(data, res);
		ee.emit('LOG',Date.now(),'web',3,'Tx',eventNames,data);
	    };
	    
	    ee.on(eventNames, funt_response);
	
	    // contenido --\/--\/--
	    
	    
	    let   dats = {};
	    for( let i in arguments_body){
		if( req.body[i] === undefined){ f.router_error('{"Accion": "400", "reason": "err: Argument body '+i+' not exist", "cause": "argument", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',400,res,name+' 1',eventNames,funt_response); return;}
		if( req.body[i] == '' )       { f.router_error('{"Accion": "400", "reason": "err: Argument body '+i+' not valid empty", "cause": "argument", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',400,res,name+' 1',eventNames,funt_response); return;}
		if( f.typeData(req.body[i]) != arguments_body[i]){ f.router_error('{"Accion": "400", "reason": "err: Argument body '+i+' not valid type, need '+ arguments_body[i]+' ", "cause": "argument", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',400,res,name+' 1',eventNames,funt_response); return;}
		dats[i] = req.body[i];
	    }

	    // source ....

	    res.setTimeout(15000, () => {
		f.router_error('{"Accion": "408", "reason": "timeout", "cause": "network_fail", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',408,res,name+' 1',eventNames,funt_response);
		return;
            });
	    
	    // contenido __/\__/\__
	    grabar(eventNames,req,res,funt_response,actionid);
	
	    req.on('close', (socket)=>{
		f.router_close(eventNames,funt_response);
	    });
	    req.on('error', function (err){
		f.router_error('{"Accion": "503", "reason": "'+err.toString()+'", "cause": "unknow", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',503,res,name+' 2',eventNames,funt_response);
	    });		    
	    req.on('socket', function(socket) { 	
		//ee.removeAllListeners(['res.post.origin.app'+actionid]);
		socket.on('error', function (err) {
		    f.router_error('{"Accion": "503", "reason": "'+err.toString()+'", "cause": "unknow", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',503,res,name+' 3',eventNames,funt_response); 
		});		
	    });

	});
    } catch(err){
	ee.off(eventNames,funt_response);
	ee.emit('LOG',Date.now(),'api',4,'err: blabla 3',err.toString());
    }	
    return router;
}


async function grabar(eventNames,req,res,funt_response,actionid){
    /* creamos la campana, la BASE general del automarcador */
    let id_marcador;
    let d = {
	"dats" : {
	    "Accion"      : 200,
	    "ID_request"  : actionid,
	    "url"         : service
	}
    };
    await f.executeSql({
	sql : 'call sp_api_aa_createCampain(?,?,?,?,?,?,?,?,?,?,?,?,?);',			  
	opt : [
	    req.body.name,
	    req.body.company,
	    req.body.state,
	    req.body.type,
	    req.body.max_contact,
	    req.body.ring,
	    f.dateYYYYmmdd(),
	    req.body.date_ini,
	    req.body.date_end,
	    req.body.callBackTime,
	    req.body.callBackTime,
	    req.body.callBackTime,
	    req.body.callBackTime
	]
    },(err,results)=>{
	if(err){
	    f.router_error('{"Accion": "503", "reason": "Create AutoMarcador", "cause": "sql_error", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',503,res,name+' 21',eventNames,funt_response);
	    return;
	}
	d.dats.id_marcador = results[1][0].id;				 			      
    });
    
    const ddis = req.body.ddi.split(',');// separamos 91xxx,92xxxx,93xxxxx  => corresponde a lunes,martes,miercoles
    for( let i in ddis){   
	await f.executeSql({
	    sql : 'call sp_api_aa_addDDI(?,?);',
	    opt : [
		d.dats.id_marcador,
		ddis[i]
	    ]
	},(err,results)=>{
	    if(err){
		f.router_error('{"Accion": "503", "reason": "DDI AutoMarcador", "cause": "sql_error", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',503,res,name+' 23',eventNames,funt_response);
		return;
	    }
	    d.dats.ddi = 'ok';
	});
    }

    /* recorremos todos los idQueue, 1231_123123, 222_222,4444_444  posiciones 0, 1 y 2*/
    const idQueue = req.body.queue.split(',');
    for( let i in idQueue){
	await f.executeSql({
	    sql : 'call sp_api_aa_addIdQueue(?,?);',
	    opt : [
		d.dats.id_marcador,
		idQueue[i]
	    ]
	},(err,results)=>{
	    if(err){
		f.router_error('{"Accion": "503", "reason": "Queue AutoMarcador", "cause": "sql_error", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',503,res,name+' 24',eventNames,funt_response);
		return;
	    }
	    d.dats.queue = 'ok';
	});
    }

    
    /*enviamos la respuesta satisfactoria */
    await ee.emit(eventNames,d,res);
    
}
    
