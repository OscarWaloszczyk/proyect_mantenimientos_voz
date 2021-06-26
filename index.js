'user strict'

console.log('/-------------------------\\');
console.log('|       Iniciando         |');
console.log('|',process.env.name);
console.log('|                         |');
console.log('|       version:          |');
console.log('|',process.env.version);
console.log('\\-------------------------/');

require('./repositories');
require('./source');