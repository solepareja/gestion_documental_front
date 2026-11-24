import fs from 'node:fs';
let source = fs.readFileSync('src/utils/pdfGenerator.js', 'utf8');
for (const [name, path, mime] of [['fuenteRegular','src/assets/fonts/PlusJakartaSans-Regular.ttf','font/ttf'],['fuenteBold','src/assets/fonts/PlusJakartaSans-Bold.ttf','font/ttf'],['logoEntrega','public/logo.png','image/png']]) {
 source = source.replace(new RegExp(`import ${name} from [^;]+;`), `const ${name} = ${JSON.stringify('data:'+mime+';base64,'+fs.readFileSync(path).toString('base64'))};`);
}
source = source.replace("'./entregaLegal.js'", "'../../src/utils/entregaLegal.js'");
fs.writeFileSync('tmp/pdfs/generator.mjs', source);
const {imprimirOdescargarPdfEntrega} = await import('./generator.mjs');
for (const [name, observaciones] of [['con-notas','Reposición por desgaste. Entrega de vestuario y equipo de protección al trabajador.'],['sin-notas','']]) {
 const data = imprimirOdescargarPdfEntrega({id:1,fechaEntrega:'2026-11-24',trabajadorNombre:'Miguel',trabajadorApellidos:'Castillo Ramos',trabajadorDni:'33445566R',trabajadorDepartamento:'Montaje y Ensamblado',observaciones,lineas:[{materialCodigo:'EPI001',materialNombre:'Zapato de seguridad (S1P)',talla:'41',cantidad:1,observaciones:'Reposición por desgaste'},{materialCodigo:'VL001',materialNombre:'Polo',talla:'M',cantidad:2,observaciones:'Vestuario de invierno'}]},true);
 fs.writeFileSync(`tmp/pdfs/${name}.pdf`,Buffer.from(data.split(',')[1],'base64'));
}
