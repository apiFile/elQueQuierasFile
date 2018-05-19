function echo(data){
	console.log(data)
}

function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}
_log = {
	run:true,
	print:function(data){
		if(this.run == true){
			console.log(data)
		}
	}
}

_node = {
	id:function(id, attr){
		if(attr == undefined){
			return document.getElementById(id)
		}else{
			return document.getElementById(id)[attr]
		}
	},
	effect:function(id){
		this.id(id).classList.remove('on')
		this.id(id).classList.add('on')
	},
	notif:function(text){
		_node.id('notif').innerHTML = text
		_node.effect('notif')
	}
}
