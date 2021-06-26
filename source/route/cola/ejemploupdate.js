'use strict';

let f  = require('../../../services').functions;
let ee = require('../../../services').ee;

const service        = 'updateCampain';
const name           = '/automarcador/V1/updateCampain';//debe de ser unico, por metodo
const arguments_body ={'id_marcador'  : 'integer'};
const arguments_update = {'id_marcador'  : 'integer'
			,'company'     : 'string'
			,'name'        : 'string'
			,'type'        : 'integer'
			,'state'       : 'integer'
			,'ring'        : 'integer'
			,'max_contact' : 'integer'
			,'ring'        : 'integer'
			,'date_ini'    : 'date'
			,'date_end'    : 'date'
			,'callBackTime': 'time'
			 };
const argments_table = {'company'     : 'empresa'
			,'name'        : 'nombre'
			,'type'        : 'tipo_motor'
			,'state'       : 'activado'
			,'ring'        : 'tiempo_ring'
			,'max_contact' : 'reintentos_max_contacto'
			,'date_ini'    : 'fecha_inicio'
			,'date_end'    : 'fecha_fin'
			,'callBackTime': 'noanswer'
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
	    update_marcador(eventNames,req,res,funt_response,actionid);
	    
	    res.setTimeout(15000, () => {
		f.router_error('{"Accion": "408", "reason": "timeout", "cause": "network_fail", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',408,res,name+' 1',eventNames,funt_response);
		return;
            });
	    
	    // contenido __/\__/\__

	
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

function update_marcador(eventNames,req,res,funt_response,actionid){
    f.executeSql({
	sql : 'call sp_api_aa_readCampain(?);',
	opt : [
	    req.body.id_marcador
	]
    },(err,results)=>{
	if(err){
	    f.router_error('{"Accion": "503", "reason": "Read AutoMarcador", "cause": "sql_error", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',503,res,name+' 21',eventNames,funt_response);
	    return;
	}
	let dats  = { "id_marcador" : req.body.id_marcador};
	for( let arg in arguments_update){
	    if( req.body[arg] === undefined){//si el dato no existe, ponemos el de la tabla existente
		dats[arg] = results[1][0][ argments_table[arg] ];
	    }else{
		if( f.typeData(req.body[arg]) != arguments_update[arg]){
		    f.router_error('{"Accion": "400", "reason": "err: Argument body '+arg+' not valid type, need '+ arguments_body[arg]+' ", "cause": "argument", "tipo_accion": "'+service+'", "accion_id": "'+actionid+'"}',400,res,name+' 1',eventNames,funt_response);
		    return;
		}
		if( req.body[arg] == null){//si dato no existe o viene vacio, ponemos el de la tabla existente
                    dats[arg] = results[1][0][ argments_table[arg] ];
                }else{
                    dats[arg] = req.body[arg];
                }

	    }	    
	}//end for

	
	f.executeSql({
	    sql : 'call sp_api_aa_updateCampain(?,?,?,?,?,?,?,?,?,?,?,?,?);',
	    opt : [dats['id_marcador']
		   ,dats['name']
		   ,dats['company']
		   ,dats['state']
		   ,dats['type']
		   ,dats['max_contact']
		   ,dats['ring']
		   ,dats['date_ini']
		   ,dats['date_end']
		   ,dats['callBackTime']
		   ,dats['callBackTime']
		   ,dats['callBackTime']
		   ,dats['callBackTime']
		  ]	    
	},( err,results)=>{
	    let d = {
		"dats" : {
		    "Accion"      : 200,
		    "ID_request"  : actionid,
		    "url"         : service,
		    "update"      : 'ok'
		}
	    }	
	    ee.emit(eventNames,d,res);
	});
    });
}
