// funcion echo en dom.js
dbScripts = {
		data:{},
		codeNew:function(key){	
			pass = this.pass
			code = Array()
			if(key == 'encode'){
				for (var i = 0; i < pass.length; i++) {
					code[i] = this.letterId(pass[i])
				}
			}else{
				for (var i = pass.length - 1; i >= 0; i--) {
					code[i] = this.letterId(pass[i])
				}
			}
			return code
		},
	/* Funciones de codificado y decodificado */
		/* diccionario */
		versionABC:'0.1',
		abc:['1','2','3','4','5','6','7','8','9','0','a','á', 'A', 'Á', 'b', 'B', 'c', 'C', 'd', 'D', 'e', 'é', 'E', 'É', 'f', 'F', 'g', 'G', 'h', 'H', 'i', 'í', 'I', 'Í', 'j', 'J', 'k', 'K', 'l', 'L',
			'm', 'M', 'n', 'N', 'ñ', 'Ñ', 'o', 'ó', 'ö', 'O', 'Ó', 'p', 'P', 'q', 'Q', 'r', 'R', 's', 'S', 't', 'T', 'u', 'ú', 'ü', 'U', 'Ü', 'v', 'V', 'w', 'W', 'x', 'X', 'y', 'Y', 'z', 'Z'],
		doStaff: function (txt, desp, action) {
			var replace = (function() {
				return function(c) {
					var i = dataBase.letterId(c);
					var l = dataBase.abc.length
					if (i != -1) {
						var pos = i;
						if (action) {
							// forward
							pos += desp;
							pos -= (pos >= l)?l:0;
						} else {
							// backward
							pos -= desp;
							pos += (pos < 0)?l:0;
						}
						return dataBase.abc[pos];
					}
					return c;
				};
			})();
			var re = (/([^ ])/ig);
			return String(txt).replace(re, function (match) {
				return replace(match);
			});
		},
		dataEncode: function() {
			code = this.codeNew('encode')
			echo('codificando con pass ' + this.pass)
			echo(code)
			for(i in this.data){
				for (var c = 0; c < code.length; c++) {
					this.dataEncoded[i] = this.doStaff(this.data[i], code[c], true);
				}
			}
		},
		dataDecode: function(dataEncoded) {
			echo('decodificar')
			echo(dataEncoded)
			code = this.codeNew('decode')
			echo(code)
			for(i in dataEncoded){
				for (var c = 0; c < code.length; c++) {
					this.data[i] = this.doStaff(dataEncoded[i], code[c], false);
				}
			}
		},
		letterId: function(letter){
			return this.abc.indexOf(letter)
		}
}