/**
 * @name MdJs
 * @version 0.1 Dev 2015/12/03
 * @author Liuyue(Hangxingliu)
 * @description Mdjs是一个轻量级的Js的Markdown文件解析器
 */
window.Mdjs = {
	/**
	 * @description 用于判断Markdown语句的正则表达式
	 */
	'regs' : {
		'ul' : /^[\*\-\+] +\S*/g,
		'ol' : /^\d+\. +\S*/g,
		'delHTML' : /<\/?[^<>]+>/g,
	},
	 /**
	 * @description0 整行样式的HTML标签
	 */
	'tag' : {
		'tBlock': ['<blockquote><p>','</p></blockquote>'],
		'tCode' : ['<pre><code data-lang="$lang">','</code></pre>'],//lang会被替换被具体语言,若没设置具体语言则为空白字符串
		'tList' : ['<li>','<ol>','<ul>','</li>'],
		'tP' : ['<p>','</p>'],
		'tToc' : ['<div class="md_toc">','<ol>','</ol>','</div>'],
		'tA': ['<a href="mailto:','<a href="','">','</a>'],
	},
	/**
	 * @description 行内样式的HTML标签
	 */
	'inlineTag' : {
		'tStrong' : ['<strong>','</strong>'],
		'tEm' : ['<em>','</em>'],
		'tCode' : ['<code>','</code>'],
		'tA' : ['<a href="','">','</a>'],
		'tImg' : ['<img src="','" title="','" />'],
	},
	/**
	 * @description 可以用斜杠转义的字符
	 */
	'_meaning' : "#`*[]()-_{}+.!\\",
	
	/**
	 * @description 判断一个元素是否在数组中
	 * @param {Object} e 元素
	 * @param {Object} arr 数组
	 */
	'_inArray' : function(e,arr){
		for(var i=0;i<arr.length;i++)
			if(e==arr[i])
				return true;
		return false;
	},
	/**
	 * @description 判断一句语句是否为一条水平分割线,即三个及以上的=_-
	 * @param {String} str Markdown语句
	 */
	'_isHr' : function(str){
		var c = str[0];
		if(c!='=' && c!='-' && c!='_' && c!='*')return false;
		for(var i=0,count=1;i<str.length;i++){
			if(str[i]==' ' || str[i]=='\t')continue;
			if(str[i]!=c)
				return false;
			count++;
			if(count==3)break;
		}
		return count==3;
	},
	/**
	 * @description 判断此句是否为列表语句
	 * @param {String} str Markdown语句
	 * @return {Number} 0:不是列表,1:数字列表ol,2:无序列表ul
	 */
	'_isAList' : function(str){
		if(Mdjs._isHr((str)))return 0;//0.2 Dev版添加的补丁,修正Hr与列表的冲突
		if(str.search(Mdjs.regs.ol)!=-1)return 1;
		if(str.search(Mdjs.regs.ul)!=-1)return 2;
		return 0;
	},
	/**
	 * @description 获得一行语句前面的空白字符(空格,Tab)数,Tab算四个
	 * @param {String} str 语句
	 * @return {Number} 语句前的空白字符的数量
	 */
	'_leftSpace':function(str){
		var lineLeft=0;
		for(var j=0;j<str.length;j++){
			if(str[j]==' ')lineLeft++;
			else if(str[j]=='\t')lineLeft+=4;
			else break;
		}
		return lineLeft;
	},
	
	/**
	 * @description 对一个字符串进行HTML转义(把空格,<,>,",'转换为)
	 * @param {String} str 字符串
	 * @return {String} 转义后的HTML
	 */
	'_htmlSafer':function(str){
		var str = str.replace(/&/g, '&gt;');
		return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;').
			replace(/\'/g, '&#39;').replace(/\"/g, '&quot;').replace(/\n/g, '</br>');
	},
	
	/**
	 * @description 判断一个语句start点后面有没有完整的]()的链接或图片的语句结构
	 * @param {String} str Markdown语句
	 * @param {Number} start 某一个起点,一般为[所在位置
	 * @return {Boolean} 是否还有完整的结构
	 */
	'_isExpressAOrImg':function(str,start){
		while(true){
			var i = str.indexOf('](',start);
			if(i==-1)return false;
			//判断找到的](中的[不是被转义的字符
			if(str[i-1]=='\\' && str[i-2]!='\\'){start=i+2;continue;}
		while(true){
			i = str.indexOf(')',i+1);
			if(i==-1)return false;
			//判断找到的)不是被转义的字符
			if(str[i-1]=='\\' && str[i-2]!='\\')continue;
			return true;
		}
		}
	},
	
	/*__________栈结构(其实我现在才知道javascript数组可以push和pop的@Version 0.2 Dev Marked)______>>>>>*/
	'_inn' : [],//存放语句前的空白字符数目 {Number}
	'_inn2': [],//存放列表的类型 {Number}
	'_innLen' : 0,//栈长度
	/**
	 * @return {Number} 弹出Top元素的空白字符数目 | -1
	 */
	'_iTop' : function(){
		return Mdjs._innLen == 0?-1:Mdjs._inn[Mdjs._innLen-1];
	},
	/**
	 * @return {Number} 弹出Top元素的列表类型 | -1
	 */
	'_iTop2' : function(){
		return Mdjs._inn2[Mdjs._innLen-1];
	},
	/**
	 * @description 压"列表元素"入栈
	 * @param {Number} v 语句前的空白字符数目
	 * @param {Number} v2 列表的类型
	 */
	'_iPush': function(v,v2){
		Mdjs._inn[Mdjs._innLen] = v;
		Mdjs._inn2[Mdjs._innLen++] = v2;
	},
	/**
	 * @description 将栈的Top元素弹出
	 * @return {Boolean} 是否弹出成功
	 */
	'_iPop' : function(){
		if(Mdjs._innLen == 0)return false;
		Mdjs._innLen--;return true;
	},
	/*<<<<<__________栈结构__________*/
	
	/**
	 * @description 将一个Markdown文本解析为可显示的HTML
	 * @param {String} md Markdown文本
	 * @param {Object} options 解析选项
	 * @return {String} HTML
	 */
	'md2html' : function(md,options){
		self = Mdjs;
		return Mdjs.handlerLines(md.split(/[\n|\r]/g));
	},
	
	/**
	 * @description 将多个Markdown语句解析成可显示的HTML
	 * @param {Array} mds 多行Markdown语句组成的数组
	 * @return {String} HTML
	 */
	'handlerLines' : function(mds){
		var res = '';
		var nowInCode = 0;//目前处理的这行是不是代码,大于等于1就是
		var lineTrim = '';//当前行去掉两端空白字符后的字符串
		var lineLeft = 0;//当前行左端的空格字符数量,//1个Tab=4个空格
		
		var tocPos = -1;//哪儿要输出目录结构
		var tocTitle = [];//记录目录每个节点的标题
		var tocLevel = [];//记录目录每个节点的层次
		var tocLen = 0;//记录目录一共有多少个节点
		
		var tmpStr = '';
		for(var i=0;i<mds.length;i++){
			lineTrim = mds[i].trim();
			
			//目前正在处理代码,或者代码结尾
			if(nowInCode>0){
				if(lineTrim=='```'){//代码结束了
					nowInCode=0;
					res+=self.tag.tCode[1];
					continue;
				}
				res+=(nowInCode==1?'':'\n')+mds[i],nowInCode++;
				continue;
			}
			
			//计算行前空格数
			lineLeft = self._leftSpace(mds[i]);
			
			//列表行
			var l = self._isAList(lineTrim);
			if(l!=0){
				res += self.handlerList(lineLeft,l,lineTrim);
				continue;
			}
			res+= self.handlerListEnd();
			
			//空白行
			if(lineTrim.length==0){
				res+='<br />';continue;
			}

			//没有Tab键在行前
			if(lineLeft < 4){
				if(lineTrim.slice(0,3)=='```'){//进入代码块
					lang = lineTrim.slice(3).trim();
					res+=self.tag.tCode[0].replace('$lang',lang);
					nowInCode = 1;continue;
				}
				
				//是标题吗?多少个标题
				for(var j=0;j<lineTrim.length;j++)
					if(lineTrim[j]!='#')
						break;
				//是标题
				if(j!=0){
					var cutEnd = lineTrim.indexOf('#',j);
					var titleText = cutEnd==-1?lineTrim.slice(j):lineTrim.slice(cutEnd);
					tocTitle[tocLen] = titleText = self.handlerInline(titleText,0);
					tocLevel[tocLen++] = j;
					res+='<h'+j+'>'+titleText+'</h'+j+'>\n';
					continue;
				}
				
				//是区块引用>
				if(lineTrim[0]=='>' && lineTrim.length>1){
					res+=self.tag.tBlock[0]+
						self.handlerInline(lineTrim,1)+'<br />';
					for(var k=i+1;k<mds.length;k++){
						tmpStr = mds[k].trim();
						if(tmpStr.length==0)break;
						if(tmpStr[0]=='>')tmpStr=tmpStr.slice(1);
						res+=tmpStr+'<br />';
					}
					res+=self.tag.tBlock[1];
					i = k - 1;
					continue;
				}
				//横线
				if(self._isHr(lineTrim)){res+='<hr />';continue;}
				
				//目录
				if(lineTrim == '[TOC]'){
					tocPos = res.length;
					continue;
				}
			}else{
				//虽然空格数大于了4,但是还是有可能:
				//代码块(需要检查上一行),普通文本
				//代码块
				if(i==0 || mds[i-1].trim().length == 0){
					res += self.tag.tCode[0].replace('$lang','') + self.handlerInline(mds[i],0);
					for(var j=i+1;j<mds.length;j++){
						if(self._leftSpace(mds[j])<4)break;
						res += '\n'+ self.handlerInline(mds[j],0);
					}
					res += self.tag.tCode[1];
					i=j-1;
					continue;
				}
			}
			//普通文本正常的一行
			//真的是上面注释的那样吗?其实如果它的下一行是---或===的话,那这一行就是标题行了
			if(i+1<mds.length){
				tmpStr = mds[i+1].trim();
				if(self._isHr(tmpStr)){//真的也,这行是标题
					var level = 3;//默认三级
					if(tmpStr[0]=='=')level=1;else if(tmpStr[0]=='-')level=2;
					tocTitle[tocLen] = titleText = self.handlerInline(lineTrim,0);
					tocLevel[tocLen++] = level;
					res+='<h'+level+'>'+titleText+'</h'+level+'>\n';
					i++;//跳行
					continue;
				}
			}
			//这下真的是普通的一行了
			res += self.tag.tP[0] + self.handlerInline(lineTrim,0) + self.tag.tP[1];
			//循环,一行结束
		}
		//如果需要输出目录
		if(tocPos!=-1){
			var res1 = res.slice(0,tocPos);
			res = res.slice(tocPos);
			res = res1 + self.handlerTOC(tocTitle,tocLevel,tocLen) + res;
		}
		return res;
	},
	
	/**
	 * 生成一个TOC目录的代码
	 * @param {String} tocTitle 目录节点的标题
	 * @param {String} tocLevel 目录节点的层次
	 * @param {Number} tocLen 目录节点集合的长度
	 * @return {String} TOC目录的HTML代码
	 */
	'handlerTOC' : function(tocTitle,tocLevel,tocLen){
		var res = self.tag.tToc[0];
		var tocI = [];
		var tocILen = 0;
		var liHTML;
		for(var i=0;i<tocLen;i++){
			liHTML = '<li>'+tocTitle[i].replace(self.regs.delHTML,'')+'</li>'
			if(tocILen == 0 || tocLevel[i]>tocI[tocILen-1]){
				res += self.tag.tToc[1]+liHTML;tocI[tocILen++] = tocLevel[i];
			}else if(tocLevel[i]==tocI[tocILen-1]){
				res += liHTML;
			}else{
				res += self.tag.tToc[2];tocILen--;i--;
			}
		}
		while((tocILen--)>0)res += self.tag.tToc[2];
		return res+self.tag.tToc[3];
	},
	
	/**
	 * @description 在处理多个Markdown语句时检测之前是不是还有列表没有结尾
	 * @returns {String} ,如果还有列表没有结尾,则返回列表结尾;反之,返回空白字符串
	 */
	'handlerListEnd' : function(){
		var res = '';
		while(self._iTop()!=-1){
			if(self._iTop2()==1)//数字列表
				res+='</ol>\n';
			else//无序列表
				res+='</ul>\n';
			self._iPop();
		}
		return res;
	},
	
	/**
	 * @description 处理一行Markdown列表语句
	 * @param {Object} level 列表语句前面有多少个空格/列表的层次
	 * @param {Number} type 哪一种列表(1:数字列表,2:无序列表)
	 * @param {Object} str Markdown语句
	 * @return {String} 此句Markdown的HTML
	 */
	'handlerList' : function(level,type,str){
		var topLevel = self._iTop();//上一个列表的层次
		var liHTML = self.tag.tList[0] + self.handlerInline(str,str.indexOf(' '),0) + self.tag.tList[3];
		var res = '';
		if(level > topLevel){//上一个列表的___子列表___
			self._iPush(level,type);
			return self.tag.tList[type] + liHTML;
		}else if(level == topLevel){//上一个列表的___兄弟(并列)列表___
			return liHTML;
		}else{//上一个列表的___父列表___的___兄弟列表___
			while(level<topLevel){//找到属于这个列表的兄弟列表
				if(self._iTop2()==1)//数字列表
					res+='</ol>\n';
				else//无序列表
					res+='</ul>\n';
				self._iPop();
				topLevel = self._iTop();
			}
			if(topLevel==-1){//这个列表是最顶层的列表,即暂时没有兄弟列表,是一个新的列表集的开始
				self._iPush(level,type);
				return res + self.tag.tList[type] + liHTML;
			}else{
				return res + liHTML;
			}
		}
	},
	
	/**
	 * @description 处理一行Markdown语句(已经去掉了头部的修饰的语句,例如去掉了标题#符号,引用>符号等等...)
	 * @param {String} text 去掉了头部的Markdown语句
	 * @param {Number} start 这个Markdown语句的起始点
	 */
	'handlerInline' : function(text,start){
		var	t = text+'\\';//在最后加上一个字符,防止越界
		var len = t.length - 1;
		var res = '';//结果
		
		//1:表示一个样式已经开始,如果再到这个样式则结束样式
		var strongStart = 0;
		var emStart = 0;
		var codeStart = 0;
		//表示粗体或斜体的样式开始的时候用的符号:*或_
		var lastStrongMark = '*';
		var lastEmMark = '*';
		//表示前面有"[","]"可以匹配"(",")"
		var aOrImgStart = false;
		
		var aOrImg = 'a';//[]()表示链接还是图片
		var isAImgTitle = false;//读取的时候读到的是链接或图片的标题吗?
		var aImgTitle = '';//链接或图片的标题
		var tmpChar = '';
		var tmpInt = 0;
		var tmpBool = true;
		
		for(var i=(start<0?0:start);i<len;i++){
			switch(t[i]){
			case '\\'://转义字符
				if(self._inArray(t[i+1],self._meaning))tmpChar=t[++i];
				else tmpChar=t[i];
				if(isAImgTitle)aImgTitle+=tmpChar;
				else res+=tmpChar;
				break;
			case '`'://行内代码
				res+=self.inlineTag.tCode[codeStart];
				codeStart=1^codeStart;
				break;
			case '*':
			case '_'://粗体斜体
				if(t[i+1]==t[i]){//粗体
					if(strongStart==0)lastStrongMark = t[i];
					else if(t[i]!=lastStrongMark){//表示正常的两个字符
						if(isAImgTitle)aImgTitle+=t[i]+t[i];
						else res+=t[i]+t[i];
						i++;break;
					}
					res+=self.inlineTag.tStrong[strongStart];
					strongStart=1^strongStart;
					i++;
				}else{//斜体
					if(emStart==0)lastEmMark = t[i];
					else if(t[i]!=lastEmMark){//表示正常的两个字符
						if(isAImgTitle)aImgTitle+=t[i];
						else res+=t[i];
						break;
					}
					res+=self.inlineTag.tEm[emStart];
					emStart=1^emStart;
				}
				break;
			case '!'://图片
				if(t[i+1]=='[')aOrImg = 'i';
				else if(isAImgTitle)aImgTitle+='!';//只是想表达一个叹号
				else res+='!';
				break;
			case '['://要读取标题了
				tmpBool = self._isExpressAOrImg(t,i);
				if(tmpBool)console.log(aImgTitle);
				if(!tmpBool || aOrImgStart){
					tmpChar = '[';
					if(t[i-1]=='!'){//误判了上一个叹号为图片修饰符,恢复
						tmpChar='![';aOrImg='';
					}
					if(isAImgTitle)aImgTitle+=tmpChar;//只是想表达一个中括号
					else res+=tmpChar;
				}else{aOrImgStart = true;isAImgTitle = true;aImgTitle = '';}
				break;
			case ']'://标题读取完成
				if(aOrImgStart)isAImgTitle = false;
				else{
					if(isAImgTitle)aImgTitle+=']';//只是想表达一个中括号
					else res+=']';
				}
				break;
			case '('://读取链接部分,这时候要把链接或图片的前缀输出了
				if(!aOrImgStart){res+='(';break;}//只是想表达一个括号
				if(aOrImg=='i')res+=self.inlineTag.tImg[0];
				else res+=self.inlineTag.tA[0];
				break;
			case ')'://读取链接部分完成
				if(!aOrImgStart){res+=')';break;}//只是想表达一个括号
				if(aOrImg=='i')res+=self.inlineTag.tImg[1];
				else res+=self.inlineTag.tA[1];
				//输出标题(图片展位字符串)
				if(aOrImg=='i'){//图片
					res+=self._htmlSafer(aImgTitle)+self.inlineTag.tImg[2];
				}else{//链接
					res+=aImgTitle+self.inlineTag.tA[2];
				}
				aOrImg = '';//回复图片或链接
				break;
			case '<'://可能是自动链接或自动邮箱
				if(!isAImgTitle){//不是标题才有可能
				tmpInt = t.indexOf('>',i);
				if(tmpInt!=-1){
					tmpChar = t.slice(i+1,tmpInt);
					if(tmpChar.search(/$\/?[\w ]*^/g)==-1){//第一次筛选,筛掉全部是字母或空格的HTML标签
					if(tmpChar.search(/^\w+:\/\/\S*/g)==0){//第二次选出URL
						res+=self.tag.tA[1]+tmpChar+self.tag.tA[2]+tmpChar+self.tag.tA[3];
						i = tmpInt;break;
					}if(tmpChar.search(/^\S+@\S+\.\w+$/g)==0){//第二次选出邮箱
						res+=self.tag.tA[0]+tmpChar+self.tag.tA[2]+tmpChar+self.tag.tA[3];
						i = tmpInt;break;
					}
					}
				}else{//干脆连>收尾都找不到了,那就转义一下<并输出
					if(isAImgTitle)aImgTitle+=t[i];
					else res+= '&lt;';
					break;
				}
				}
			default://基本字符
				if(isAImgTitle)aImgTitle+=t[i];
				else res+=t[i];
			}
		}
		//如果此句结束了粗体,斜体,行内代码还没有正常结束的话就自动补充
		if(codeStart==1)res+=self.inlineTag.tCode[1];
		if(emStart==1)res+=self.inlineTag.tEm[1];
		if(strongStart==1)res+=self.inlineTag.tStrong[1];
		return res;
	},
	
};