chrome.runtime.onMessage.addListener(function (request,sender, sendResponse) {
    //Finds the matches of the searched word
    const re = new RegExp(request,'gi')
    const matches = document.documentElement.innerText.match(re)

    // Error Handling for appearence of searched word in current web page
    var appear_current;
    try{
        appear_current=matches.length;
        console.log("The correct numer of matches is:",appear_current);
    }catch (e) {
        if(e instanceof TypeError){
            appear_current=0;
            console.log("The correct number of matches is:",appear_current);
        }else{
            appear_current=0;
        }
    }

    // Highlights the matched words that are just text
    var parents=[];
    var children=[];

    //Find all text nodes, and add their parents to a list
    recursiveFindTextNodes(0,document.body,function (parent, node) {
        if(node.data.match(re)){
            parents.push(parent);
            children.push(node);
        }
    });

    //The list only contains elements with text as their children
    //Loop through the list and replace any matches
    var count_color=0;
    for(let i=0; i< parents.length; i++){
        var parent = parents[i];
        var node = children[i];
        var div = document.createElement("span");
        parent.replaceChild(div,node);
        div.innerHTML = node.data.replace(re, function (match) {
            count_color=count_color+1;
            return "<mark style='background-color:#FFF34D; border-radius: 5px;'>"+match+"</mark>";
        });
    }
    //Logs number of highlights
    console.log("Number of highlights:",count_color.toString());

    //Extracts all the usefully hyperlinks and pushes it into an array
    var x= document.querySelectorAll("a");
    var myarray = []
    for (var i=0;i<x.length; i++){
        var href_validility=x[i].href.toString();
        if(href_validility.indexOf("http://")==0||href_validility.indexOf("https://")==0){
            var nametext=x[i].textContent;
            var cleantext= nametext.replace(/\s+/g,' ').trim();
            var cleanlink= x[i].href;
            // myarray.push([cleantext,cleanlink]);
            myarray.push(cleanlink);
        }
    }

    var numarray=[];

    var max = x.length;
    for(var k=0; k<x.length; k++){
        var xhr = new XMLHttpRequest();
        // OPEN - type, url/file, async
        xhr.open("GET",myarray[k],true);

        var url;
        var num;

        xhr.onreadystatechange = function(){
            if(this.readyState == 4 && this.status == 200){
                // console.log("Inside the xhr");
                var response= this.responseText;

                var parse = new DOMParser();

                var html_new = parse.parseFromString(response,'text/html');

                var parents_new=[];
                var children_new=[];

                //Find all text nodes, and add their parents to a list
                recursiveFindTextNodes(0,html_new.body,function (parent, node) {
                    if(node.data.match(re)){
                        parents_new.push(parent);
                        children_new.push(node);
                    }
                });

                var count_appearence=0;
                for(let i=0; i< parents_new.length; i++){
                    var parent = parents_new[i];
                    var node = children_new[i];
                    div.innerHTML = node.data.replace(re, function (match) {
                        count_appearence=count_appearence+1;
                    });
                }
                // console.log("The appearence in new website is:",myarray[k],count_appearence.toString());

                //Displays the website and appearence number together async
                console.log("The appearence in new website is:",this.responseURL.toString(),count_appearence.toString());
                // url=this.responseURL.toString();
                // num=count_appearence.toString();

                chrome.runtime.sendMessage({
                    url:this.responseURL.toString(),
                    num:count_appearence.toString(),
                    limit:max
                },function (response) {
                    console.log(response);
                });

            }

            if(this.status==403){
                // alert('FORBIDDEN');
                chrome.runtime.sendMessage({
                    url:this.responseURL.toString(),
                    num:"0",
                    limit:max
                },function (response) {
                    console.log(response);
                });
            }

            if(this.status==404){
                // alert('PAGE NOT FOUND');
                chrome.runtime.sendMessage({
                    url:this.responseURL.toString(),
                    num:"0",
                    limit:max
                },function (response) {
                    console.log(response);
                });

            }


        }

      xhr.send();


    }

    sendResponse({count: appear_current,list:myarray,len:x.length})

})

function recursiveFindTextNodes(parent, node, func) {
    // nodeType 3 designates text
    if(parent && node.nodeType === 3 ){
        if(parent.tagName!=="SCRIPT" && parent.tagName!=="STYLE" && parent.tagName!=="IFRAME" && parent.tagName !=="CANVAS"
        && parent.tagName!=="META"){
            func(parent, node);
        }
    }else{
        // Loop through children and make recursive calls
        for(let i=0; i<node.childNodes.length; i++){
            recursiveFindTextNodes(node, node.childNodes[i],func);
        }
    }

}