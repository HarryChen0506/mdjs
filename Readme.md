# Mdjs

> Mdjs是一个易用的轻量级的Js的Markdown文件解析器

---
`2015年12月04日`

Version `0.2 Dev`

欢迎大家参考学习,也望大家能够对本解析器中的不足或错误进行指正批评.

开发者: **刘越(HangxingLiu)**
![我的微博:](http://www.sinaimg.cn/blog/developer/wiki/LOGO_16x16.png)[@航行刘](http://weibo.com/chinavl)


[TOC]

## 开源声明

Mdjs遵循[Apache Licence 2.0](LICENSE)

> 允许使用在商业应用中,允许通过修改来满足实际需求\(但需要在被修改的文件中说明\).

## 使用方法

``` html
	<script src="mdjs.min.js" type="text/javascript" charset="utf-8"></script>
```

``` javascript
	var html = Mdjs.md2html(markdown);
```

## 语法支持

目前用的广泛使用的Markdown语法都能被正常解析,一些使用广度不大的语法也会在稍后的版本中一一更新.
详细支持情况可以参考[开发手册](wikis/Developer)

> **注意**:流程图,时序图,LaTeX公式的解析将不会在我的Mdjs主线中版本中出现

## 演示文件

- `demo.html` : 简单的Markdown显示样例
- `demoEditor.html` : 简单的Markdown实时预览编辑器样例

## 注意事项

1. 本解析器对解析出来的HTML不带任何CSS样式,不带代码高亮功能,这些可以又开发者自由搭配选择
2. 这个解析器没有自带的Markdown编辑器功能,所以如果你要使用本解析器制作一个前端Markdown编辑器,则你需要编写一个前端界面

## 开发手册

[开发手册](wikis/Developer)
