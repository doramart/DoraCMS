/**
 * Created by Administrator on 2015/10/15.
 */
module.exports = RandomWord;

function RandomWord(chars){
    if(!(this instanceof RandomWord)){
        return new RandomWord(chars);
    }
    this._chars = "";
    if(chars){
        this.add(chars);
    }
}

RandomWord.prototype = {
    add:function(chars){
        this._chars += chars;
        return this;
    },
    random:function(size){
        var len = this._chars.length;
        if(len === 0){
            throw new Error('no chars,please use add(chars)');
        }
        var word = "";
        for(var i=0;i<size;i++){
            var cpo = parseInt(Math.random()*len);
            word += this._chars.charAt(cpo);
        }
        return word;
    }
}