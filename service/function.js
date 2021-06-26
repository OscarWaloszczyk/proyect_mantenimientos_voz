'use strict';

const { NULL } = require('mysql2/lib/constants/types');

let server_online           = [];
let ee                      = require('./').ee;
let serverInfo              = require('./').serverInfo;
let channelINCALL           = require('./').channelsINCALL;
let endpoint_rechable_sys   = require('./').endpoint_rechable_sys;
let queue                   = require('./').queue;
let mysql                   = require('./').mysql;
let mysqlBak                = require('./').mybak;
/**
 * Generate UUID strings.
 * @return {string} generated uuid
 */
let actionIDGenerator = function(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(q) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (q=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
}
/**
 * @description devueleve el la ip del servidor que esta online en funcion de su identificador 
 * @param {String} id 
 */
let serverReturnIP = function(id){
    for (let i = 0; i < server_online.length; i++) {
        if (server_online[i].id == id){
            return server_online[i].ip;
        }
    }
}
/**
 * @description devuelve elidentificdor de una llamada
 * @param {string} endpoint numero de la extesnion
 * @returns {string} sistem 
 */
function returnserver_from_endpoint(endpoint){
    for (let i in channelINCALL){
        if (channelINCALL[i].endpoint == 'PJSIP/'+endpoint){ // error revisar
            return channelINCALL[i].sistem;
        }
    }
}
/**
 * @description Respuesta a los post de las api's
 * @param {object} data 
 * @param {object} res 
 */
let responsePost = (data, res) => {
    try {
        if (data.dats.Accion == "FAIL"){
	    return
        }
        res.status(200).send(data.dats);
	res.end();
    } catch (e) {
        console.log(e);
	return;
    }
}
/**
 * @description 
 * @param {int} id id del grupo de admins 
 */
let getIpAdmin = (id) =>{
    try {
        for (let i = 0; i < serverInfo.length; i++){
            console.log(serverInfo[i])
            for (let a in serverInfo[i].pbx_group){
                console.log(serverInfo[i].pbx_group[a])
                if (serverInfo[i].pbx_group[a] == id[0]){
                    return serverInfo[i].ip;
                }
            }
        }
    }catch (errr){
        console.log(errr);
    }
}

/**
 * @description Devuelve de manera random una de las ips del servidor node admin
 */
let returnServerProxyRandom = function(){
    try {
        if (serverInfo.length != 0){
            let length_server_in_system = serverInfo.length;
            let random_num_server = Math.floor(Math.random() * length_server_in_system);
            return serverInfo[random_num_server].ip;
        } else{
            return null;
        }
    }catch(err){
	ee.emit('LOG',Date.now(),'web',4, 'returnServerProxyRandom', err);
    }
}

/**
 * 
 * @param {string} endpoint = numero de extension (1001) 
 * @returns {string} uuid
 */
let returnUuid_from_endpoint = function (endpoint){
    try {
        for (let i in channelINCALL){
            for (let u in channelINCALL[i]){
                if (channelINCALL[i][u].endpoint==endpoint){
                    return u;
                }
            }
        }
    } catch (error) {
        ee.emit('LOG', Date.now(),'web',4, 'err :returnUuid_from_endpoint', error);
    }
}
/**
 * @description VERIFCA SI EL AGENTE NO ESTA EN USO
 * @param {interface+exten} call 'PJSIP/XXXX'
 */
let getCallAgent = function (call){
    try {
        let c = 0
        for (let i in endpoint_rechable_sys){
            //verificamos si el estado es uno disponible
            c+1;
            if(endpoint_rechable_sys[i][call].estado == 'NOT_INUSE' && endpoint_rechable_sys[i][call].estado_logico == 1){
                // Verificamos por si acaso si el agente no esta en una llamada
                let s = 0;
                for (let f in channelINCALL){
                    s+1;
                    console.log('Llamada a analizar ',channelINCALL[f]);
                    if (Object.keys(channelINCALL[f]).length > 1 && channelINCALL[f].channel == call){
                        return 0;
                    }else {
                        return 1;
                    }
                }
                //no hay llamadas en curso
                if (Object.keys(channelINCALL).length == 0){
                    return 1
                }
            }else{
                // el agente no tiene el estado not in use ni el estado logico a 1,
                return 0
            }
        }
        // no hay endponts en el sistema
        if (Object.keys(endpoint_rechable_sys).length == 0){
            return 0
        }
    } catch (err) {
        ee.emit('LOG', Date.now(),'web',4, 'err :getstatusAgente', err);
    }
}
/**
 * @description en caso de que una extension pertenzca a una cola, se pausa en esta
 * @param {object} dat {time, actionid, uuid, exten, exten, cod_tarea, cod_hilo, cola, agente, cola_personal, audio_text, action}
 */
function setPausedAgent(dat) {
    try {
        let server_event =  returnServerProxyRandom();
        if (server_event == null){
            server_event = 'NodeJS_ADMIN';
        }
        let dats_req = {event_name: 'MAC|paused_agent', dats:{
            agent:dat.agente, 
            cola: dat.cola, 
            company:dat.empresa, 
            time: dat.time, 
            event_respose:'res.post.pausedAgecMAC.app'+dat.actionid, 
            action_type: "Paused_Agent_call_from_Mac", 
            uuid: dat.uuid, 
            cliente: null}};
        ee.emit(server_event,dats_req);

        ee.on('res.post.pausedAgecMAC.app'+dat.actionid, function(dat){
            if(dat.dats.Action == "success"){
                console.log(dat.dats)
            }
        });
    }catch (err){
	ee.emit('LOG', Date.now(),'MAC',4,'MAC|setPausedAgent', err);
    }
}
/**
 * @description vrifica si una extension esta disponible para recbir una llamada
 * @param {string} dat en id del endpoint 'PJSIP/{exten}' 
 */
let getDeviceState = (dat) => {
    try {
        for(let i in endpoint_rechable_sys){
            if(endpoint_rechable_sys[i]['PJSIP/'+dat] !== undefined){
                if (statusAvaliabel(endpoint_rechable_sys[i]['PJSIP/'+dat].estado)){
                    return {respuesta: 1, "device": dat, "state": endpoint_rechable_sys[o]['PJSIP/'+dat].estado, "data":endpoint_rechable_sys[o]['PJSIP/'+dat]};
                }else {
                    return {respuesta: 0, "device": dat, "state": endpoint_rechable_sys[o]['PJSIP/'+dat].estado, "data":endpoint_rechable_sys[o]['PJSIP/'+dat]};
                }
            }else{
                if (endpoint_rechable_sys.length-1 == i){
                    return {respuesta: 0, "device": dat, "state": "NO_DISPONIBLE", "data":"NULL"};
                }
            }
        }
        if(endpoint_rechable_sys.length == 0){
            return {respuesta: 0, "device": dat, "state": "NO_DISPONIBLE_SERVICIO_EXTENSIONS", "data":"NULL"};
        }
    } catch (err) {
        ee.emit('LOG', Date.now(),'web',4,'err: getstatusAgente', err);
    }
};
/**
 * @description funcion auxiliar de getDeviceState() 
 * @param {estado} estado 
 */
function statusAvaliabel(estado) {
    switch (estado) {
        case 'NOT_INUSE':
            return true;
        case 'INUSE':
            return true;
        case 'RINGING':
            return true;
        default:
            return false;
    }
}


/**
   * @description Borrar el event emiter
   * @param {string} eventNames     Nombre del evento
   * @param {objet}  funt_response  Function de respuesta
*/
let router_close = function(eventNames,funt_response){
    ee.off(eventNames, funt_response);
};



/**
   * @decription Cuando el post dfe error, se cierra la conexion, se muestra error y se cierra el ee
   * @param {string} Err            Error
   * @param {object} req            Request de la peticion
   * @param {string} url            Route URL
   * @param {string} eventNames     Nombre del evento
   * @param {objetc} funt_response  Function de respuesta 
*/
let router_error = function(err,code,res,url,eventNames,funt_response){
    router_close(eventNames,funt_response);
    res.status(code).send(err);
    res.end();
    ee.emit('LOG',Date.now(),'web',4,'Error en ',url,eventNames,err.toString());    
};

//f.router_exeption('{"Accion": "503", "reason": "'+err.toString()+'", "cause": "unknow", "tipo_accion": "'+service3+'"}',503,res,name2+' 3')
/**
 * @description Cuando el post dfe error critical, se cierra la conexion, se muestra error y se cierra el ee
 * @param {string} Err            Error
 * @param {object} req            Request de la peticion
 * @param {string} url            Route URL
 */
const router_exeption = (err,code,res,url)=>{
    try {
        res.status(code).send(err);
        res.end();
        ee.emit('LOG',Date.now(),'web',4,'Error en ',url,err.toString()); 
    } catch (err) {
        ee.emit('LOG',Date.now(),'web',4,'Error en ',err.toString()); 
    }
}


/**
 * @description verifica si una varible esta declarada
 * @param {string} varname 
 */
let checkVariable = (varname) =>{
    if ((typeof varname !== undefined && varname !== null) && varname !== ''){
        return true;
    } else{
        return false;
    }
}

/**
 * @description devuelve cantidad de antes en una cola, si este es cero dice que respuesta es 0 si es uno se verifica su estado
 * @param {object} dat 
 */
let getqueueMembers = (dat) => {
    try {
        // respuesta {'respuesta': 2, 'queue': req.body.queue, 'members':NULL, 'list_memebers':NULL, 'data':req.body}
        let conn = 0;
        for (let i in queue){
            //console.log('COLA DE getqueueMembers',queue[i])
            for (let u in queue[i]){
                if (u.split('_')[1] == dat){
                    conn = 1;
                    if (Object.keys(queue[i][u].members).length >= 1){
                        let disponible = 'UNAVALIABLE';
                        for (let k in queue[i][u].members){  
                            if (queue[i][u].members[k].Status !== undefined && memberrechabe(queue[i][u].members[k].Status.toString()) && queue[i][u].members[k].Paused == 0){
                                for (let j in endpoint_rechable_sys){
                                    console.log(endpoint_rechable_sys[j][k]);
                                    if (endpoint_rechable_sys[j][k].estado !== 'UNAVALIABLE' && endpoint_rechable_sys[j][k].estado_logico == 1){
                                        disponible = 'NOT_INUSE';
                                    }   
                                }
                            }else if (queue[i][u].members[k].Status === undefined){
                                for (let j in endpoint_rechable_sys){
                                    console.log(endpoint_rechable_sys[j][k]);
                                    if (endpoint_rechable_sys[j][k].estado !== 'UNAVALIABLE' && queue[i][u].members[k].Paused == 0 && endpoint_rechable_sys[j][k].estado_logico == 1){
                                        disponible = 'NOT_INUSE';
                                    }   
                                }
                            }
                        }
                        if (disponible !== 'UNAVALIABLE'){
                            return {respuesta: 1, queue: dat, members:queue[i][u].members.length, list_memebers:queue[i][u].members, data:queue[i][u]};
                        }else {
                            return {respuesta: 0, queue: dat, members:queue[i][u].members.length, list_memebers:queue[i][u].members, data:queue[i][u]};
                        }
                    }else{
                        return {respuesta: 0, queue: dat, members:queue[i][u].members.length, list_memebers:null, data:queue[i][u]};
                    }
                }
            }
        }
        if (conn==0){//
            return {respuesta: 0, queue: dat, members:null, list_memebers:null, data:null};// --- > cola no localizada, da error
        }//
    } catch (error) {
        ee.emit('LOG', Date.now(),'web',3,'err: getqueueMembers', error);
        return {respuesta: 0, queue: dat, members:null, list_memebers:null, data:null};
    }
};

function memberrechabe(dat) {
    switch (dat) {
        case '5':
            return false;
            break;
        case '4':
            return false;
            break;
    
        default:
            return true;
            break;
    }
}

const regex = {
    'integer' : /(\d+[,]?)+/g,  //integer + integers in array
    'time'    : /(\d?\d):(\d\d?):?(\d\d?)?/g,
    'date'    : /(\d\d\d\d)(\\|-)(\d\d)(\\|-)(\d\d)/g,
    'string'  : /([a-zA-Z0-9,;.:\-_@?��'\[\]\(\){}]*)/g,

}

function typeData(data){
    if (typeof data === 'object'){
        return 'json';
    }
    for( let reg in  regex){
	const x = data.match(regex[reg]);
	if( x != null ){
	    if( x[0] == data){		
		return reg;
	    }
	}
    }
    try{
	const x = JSON.parse(data);
	return 'json';
    }catch{
	return 'unknow';
    }
}

function dateYYYYmmdd() {
    var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}


/**
 * @description se ejecuta un porcediemtno en mysql se debe pasar los paramtros en opt [] y sql
 * @param {*} dats 
 * @param {*} cb 
 * @returns 
 */
const executeSql = async (dats, cb) =>{
    try {
        const rows = await mysql.promise().query(dats.sql, dats.opt);
        if (rows !== undefined){
            return cb(null, [1, rows[0][0]]);
        } else {
            return cb(null, [0, null]);
        }
    } catch (err) {
        ee.emit('LOG', Date.now(), 'func_reports',4, 'ERR func: executeSql', err.toString());
        return cb(err, [0, null]);
    }
}


/**
 * @description se ejecuta un porcediemtno en mysql se debe pasar los paramtros en opt [] y sql
 * @param {*} dats 
 * @param {*} cb 
 * @returns 
 */
const executeBakSql = async (dats, cb) =>{
    try {
        const rows = await mysqlBak.promise().query(dats.sql, dats.opt);
        if (rows !== undefined){
            return cb(null, [1, rows[0][0]]);
        } else {
            return cb(null, [0, null]);
        }
    } catch (err) {
        ee.emit('LOG', Date.now(), 'func_reports',4, 'ERR func: executeSql', err.toString());
        return cb(err, [0, null]);
    }
}
module.exports = {
    actionIDGenerator,
    serverReturnIP,
    getCallAgent,
    returnServerProxyRandom,
    returnUuid_from_endpoint,
    setPausedAgent,
    getDeviceState, 
    getqueueMembers,
    checkVariable,
    getIpAdmin,
    responsePost,
    router_close,
    router_error,
    returnserver_from_endpoint,
    typeData,
    dateYYYYmmdd,
    executeBakSql,
    executeSql,
    router_exeption
}
