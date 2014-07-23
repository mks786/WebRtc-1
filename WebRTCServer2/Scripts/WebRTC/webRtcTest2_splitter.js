/// <reference path="../Recorder/MediaRecorder.js" />
/// <reference path="../jquery.signalR-1.1.3.js" />
/// <reference path="../Recorder/MediaStreamRecorder.js" />



var rootpath = basePath;

var countOfConnections = 0;
var hub = $.connection.SignalingIceSdp2;

var connectionidThis;
var usernameThis;
var connectionidOther;
var usernameOther;
var pc;
var index = 0;
var isInitiatator = false;
var localStream;
var remoteStream;
var manageAudioStreamIndexPassed = 0;

var Configuration = { "iceServers": [{ "url": "stun:stun.services.mozilla.com" }] };

var timeStart = 0;
//hub.client.offeredIce = function (connectionId, userName, ice) {

//    $("#log").text(connectionId + "  " + userName + "  " + ice);

//}



function manageAudioStream() {
    manageAudioStreamIndexPassed++;
   var stream = localStream;
   var streamRemote = remoteStream;
   console.log("function manageAudioStream at line 36, manageAudioStreamIndexPassed :", manageAudioStreamIndexPassed.toString());
    if (manageAudioStreamIndexPassed == 3) {
        var url = rootpath + "/api/wavfiles";

        var context = new AudioContext();
        audioInput = context.createMediaStreamSource(stream);
        audioInputRemote = context.createMediaStreamSource(streamRemote);

        splitter = context.createChannelSplitter(2);

        audioInput.connect(splitter);

        splitterRemote = context.createChannelSplitter();
        audioInputRemote.connect(splitterRemote);

        merger = context.createChannelMerger(2);
        merger2 = context.createChannelMerger(2);
       //splitterRemote.connect(merger);
       // splitter.connect(merger);
      
        audioStreamDestNode = context.createMediaStreamDestination();
        splitter.connect(merger, 0);
        splitterRemote.connect(merger, 0);

        splitter.connect(merger2, 1);
        splitterRemote.connect(merger2, 1);

        merger.connect(audioStreamDestNode);

        merger2.connect(context.destination);
        
        


        //audioInputRemote.connect(merger);

        //audioInput.connect(merger);
      
       // merger.connect(audioStreamDestNode);

        //var context2 = new AudioContext();
        //audioInput2 = context2.createMediaStreamSource(audioStreamDestNode.stream);
        //audioInput2.connect(context2.destination);




        var mediaRecorder = new MediaStreamRecorder(audioStreamDestNode.stream);
 //   var mediaRecorderRemote = new MediaStreamRecorder(streamRemote);
    mediaRecorder.mimeType = 'audio/wave'; 
   // mediaRecorderRemote.mimeType = 'audio/wav';

     //  mediaRecorder.mimeType = 'audio/ogg';
   // mediaRecorderRemote.mimeType = 'audio/ogg';


    mediaRecorder.ondataavailable = function (blob) {
        
        console.log("blob : ", blob);

        var form = new FormData();
        index++;
        var t = new Date();
        if (timeStart == 0) timeStart = t;
        form.append("blob", blob, connectionidThis + "_" + connectionidOther + "_" + timeStart.getTime() + "_" + index.toString() + "_" + t.getTime() + "_" + blob.size);
        // POST/PUT "Blob" using FormData/XHR2
        var oReq = new XMLHttpRequest();
        oReq.open("POST", url, true);
        oReq.onload = function (oEvent) {
            // Uploaded.
        };

        oReq.send(form);
    }

   

    //mediaRecorderRemote.ondataavailable = function (blob) {

    //    $("#log").append('<p>' + "initiator-" + blob.size.toString() + '</p>');

    //    var form = new FormData();
    //    index++;
    //    var t = new Date();
    //    form.append("blob", blob, "initiator-" + index.toString() + "_" + t.getTime());
    //    // POST/PUT "Blob" using FormData/XHR2
    //    var oReq = new XMLHttpRequest();
    //    oReq.open("POST", url, true);
    //    oReq.onload = function (oEvent) {
    //        // Uploaded.
    //    };

    //    oReq.send(form); 
    //}


    mediaRecorder.start(3000);
    //mediaRecorderRemote.start(100000);
  }

    //var context = new window.webkitAudioContext();
    //var inputAudioStream = context.createMediaStreamSource(stream);
    //inputAudioStream.connect(context.destination);
    //inputAudioStream.mediaStream.stop();

}





//function manageAudioStream2(stream) {

//    var url = "api/wavfiles";
//    var mediaRecorder = new MediaStreamRecorder(stream);

//    mediaRecorder.mimeType = 'audio/ogg';
//    mediaRecorder.ondataavailable = function (blob) {

//        $("#log").append('<p>' + blob.size.toString() + '</p>');

//        var form = new FormData();
//        index++;
//        form.append("blob", blob, "test1" + index.toString());
//        // POST/PUT "Blob" using FormData/XHR2
//        var oReq = new XMLHttpRequest();
//        oReq.open("POST", url, true);
//        oReq.onload = function (oEvent) {
//            // Uploaded.
//        };

//        oReq.send(form);
//    }

//    mediaRecorder.start(15000);

//    //var context = new window.webkitAudioContext();
//    //var inputAudioStream = context.createMediaStreamSource(stream);
//    //inputAudioStream.connect(context.destination);
//    //inputAudioStream.mediaStream.stop();

//}







function processMessage(connectionidSender, usernameSender, evt) {
    var message = JSON.parse(evt);
    console.log("line 376 hub.client.onmessage", message);
    console.log("line 376 +1 hub.client.onmessage messagemessage != 'onaddstreamfired' ", message != "onaddstreamfired");
    if (message.sdp) {
        console.log("line 378 before setRemoteDescription :", message);
        console.log("line 378+1 before setRemoteDescription :", message);
        pc.setRemoteDescription(new mozRTCSessionDescription(message.sdp), function () {
            // if we received an offer, we need to answer
            if (pc.remoteDescription.type == "offer")
                console.log("create_ANSWER line 382 inside pc.setRemoteDescription( ")
            pc.createAnswer(localDescCreated, logError);
        }, logError);
    }
    if (message.candidate && message.candidate.length >= 1) {
        console.log("addIceCandidate line 392 inside pc.setRemoteDescription( message.candidate :", message.candidate);
        pc.addIceCandidate(new mozRTCIceCandidate(message.candidate));
    }
    if (message == "onaddstreamfired")
        if (!isInitiatator) manageAudioStream();
}











function localDescCreated(description) {
    console.log("4.1  inside ' function localDescCreated(description) {' ");
    pc.setLocalDescription(description, function () {
        console.log("4.2 SEND inside '    pc.setLocalDescription(description, function () {'  before send : ", JSON.stringify({ "sdp": pc.localDescription }) );
        hub.server.send(connectionidOther, usernameOther, JSON.stringify({ "sdp": pc.localDescription }));
        console.log("4.3  inside '    pc.setLocalDescription(description, function () {' after send ");

        //hub.server.offerSdp(connectionidOther, usernameOther, JSON.stringify({ "sdp": pc.localDescription }))
        // hub.server.sendSdp(connectionidOther, usernameOther, JSON.stringify({ "sdp": pc.localDescription }))
    }, logError);
}






function logError(e) {
    console.log("logError(e) e: ", e);

}
function start(connectionidSender, usernameSender, evt) {

    pc = new mozRTCPeerConnection(Configuration);
    window.navigator.getUserMedia({ video: true, audio: true }, function (stream) {

        var videoSelf = document.createElement("video");
        $(videoSelf).prop("width", 200);
        $("#videoPlaceForSelf").append(videoSelf);
        console.log("7  inside window.navigator.getUserMedia ");
        videoSelf.src = URL.createObjectURL(stream);
        console.log("8  inside '  window.navigator.getUserMedia ");
        videoSelf.play();

        console.log("9  inside window.navigator.getUserMedia ");
        pc.addStream(stream);
        console.log("10  inside '   window.navigator.getUserMedia ");
        localStream = stream;



        if (isInitiatator) {

            console.log("4new  inside '   pc.onnegotiationneeded = function () {' ");

            pc.createOffer(localDescCreated, logError)
            console.log("5new  inside '   pc.onnegotiationneeded = function () {' ");
        }


        if (!isInitiatator) {
            processMessage(connectionidOther, usernameSender, evt);
            manageAudioStream();
        }

    }, function error() {
        alert("error");
    });


    console.log("1  after ' pc = new mozRTCPeerConnection(Configuration);' ");

    pc.onicecandidate = function (event) {
        console.log("2  inside '   pc.onicecandidate = function (event){' ", event.candidate?event.candidate:"no candidate");
        if (event.candidate) {
            console.log("3 SEND  ' inside '   pc.onicecandidate = function (event){'  before send:", event.candidate);
            hub.server.send(connectionidOther, usernameOther,  JSON.stringify({ "candidate": event.candidate }));
           // signalingChannel.send(JSON.stringify({ "candidate": evt.candidate }));
    
        //  hub.server.offerIce(connectionidOther, usernameOther, JSON.stringify({ "candidate": event.candidate }));
       // hub.server.sendIce(connectionidOther, usernameOther, JSON.stringify({ "candidate": event.candidate }));
        //signallingChannel.send(JSON.stringify({ "candidate": event.candidate }));
      //  hub.server.send(JSON.stringify({ "candidate": event.candidate }));
        }

    };

    pc.oniceconnectionstatechange = function (e) {
        console.log("3.5 ' pc.oniceconnectionstatechange ' event object: ", e)


    }







    pc.onnegotiationneeded = function () {
        console.log("4  inside '   pc.onnegotiationneeded = function () {' ");

        pc.createOffer(localDescCreated, logError)
        console.log("5  inside '   pc.onnegotiationneeded = function () {' ");
    }


    pc.onaddstream = function (data) {
        console.log("6  inside '     pc.onaddstream = function (data) {' ");
        var videoRemote = document.createElement("video");
        $(videoRemote).prop("width", 400);
        $("#videoPlaceForRemote").append(videoRemote);
        videoRemote.src = URL.createObjectURL(data.stream);
        remoteStream = data.stream;
    
        videoRemote.play();
        hub.server.send(connectionidOther, usernameOther, JSON.stringify("onaddstreamfired"));
            if (!isInitiatator) manageAudioStream();
       
    };




  



}



$(function () {



    $.connection.hub.start().done(function () {
        hub.server.receiveMyConnectionId();
        hub.server.updateCallOperatorsList();
     

        //$("#input").dblclick(function (e) {

        //    hub.server.offerIce($("#input").val(), "Ice");
        //});


       }

    )


    hub.client.addedCallOperator = function (connectionId, userName, IsInRTC) {

        $("<p></p>", {
            "id": userName, text: userName, click: function (e) {
                hub.server.offerIce(this.text, "testIce")
            }
        }).appendTo("#main");




    };


    hub.client.updatedCallOperatorList = function (dictionaryUsernamesConnectionIds) {

        function setCss(indexCss, valueCss){
             var i = 4;
            
        }
       
        $("#calloperators").html('');

        $.each(dictionaryUsernamesConnectionIds, function (index, value) {
            $("#calloperators").append("<li data-connectionid='" + value.ConnectionId + "' data-username='" + index + "' >" + index + ":" + " Είναι σε συνδιάλεξη: " + value.IsInRTC + "</li>")
                .css('background-color', setCss);
        })

        $("#calloperators li").each(
           function (index, element) {
               element.onclick = clickForVideoConference
           });
    }



    hub.client.updatedCallOperatorList2 = function (DictionaryConnectionIdSignalUser) {

//         function setCss(indexCss, valueCss){ 
//             var i = indexCss;
//             var v= valueCss;
//         }

        $("#calloperators").html('');


        //$.each(DictionaryConnectionIdSignalUser, function (index, value) { $("#calloperators").append("<li data-connectionid='" + index + "' data-username='" + value.Username + "' >" + value.Username + ":" + " Είναι σε συνδιάλεξη: " + value.IsInRTC + "</li>").css('background-color', value.IsInRTC ? 'red' : 'green') })
        $.each(DictionaryConnectionIdSignalUser, function (index, value) { 
        $("#calloperators").append("<li data-connectionid='" + index + "' data-username='" + value.Username + "' data-IsInRTC ='" + value.IsInRTC +"' >" + value.Username + ":" + " Είναι σε συνδιάλεξη: " + value.IsInRTC + "</li>")
        
        })



        $("#calloperators li").each(
           function (index, element) {
               if(element.dataset.connectionid ==connectionidThis) $(element).css('background-color', 'blue');
               else{
              
               if(element.dataset.isinrtc == "false")
               { 
               element.onclick = clickForVideoConference;
               $(element).css('background-color', 'green');
               }
               else{$(element).css('background-color','red');
               }
               
               }
           });
    }


    hub.client.receivedMyConnectionId = function (myConnectionId, myuserName)
    {
        connectionidThis = myConnectionId;
        usernameThis = myuserName;
    }



 

    hub.client.onmessage = function (connectionidSender, usernameSender, evt) {
        console.log("inside hub.client.onmessage line 373 evt: ", evt)
        if (!connectionidOther || connectionidOther == "") connectionidOther = connectionidSender;
        if (!pc) {
            start(connectionidSender, usernameSender, evt);
        }
        else processMessage(connectionidSender, usernameSender, evt);

    };







    hub.client.receivedSdp = function (connectionId, userName, SdpJson) {
        if (!pc) start();
        var sdp = JSON.parse(SdpJson);
        pc.setRemoteDescription(new mozRTCSessionDescription(sdp), function () {
            // if we received an offer, we need to answer
            if (pc.remoteDescription.type == "offer")
                pc.createAnswer(localDescCreated, logError);
        }, logError);
    }

    hub.client.receivedIce = function (connectionId, userName, IceJson) {
        if (!pc) start();
        var ice = JSON.parse(IceJson);
        pc.addIceCandidate(new mozRTCIceCandidate(ice.candidate));
    }



    //hub.client.offeredIce = function (connectionId, userName, IceJson) {

    //    $("#logError").append("<li>" + "hub.client.offeredIce " + "</li>");

    //    connectionidOther = connectionId;
    //    usernameOther = userName;
    //    var ice = JSON.parse(IceJson);
    //    pc.addIceCandidate(new RTCIceCandidate(ice.candidate));
    //}
















    //hub.client.answeredSdp = function (connectionId, userName, SdpJson) {
    //    $("#logError").append("<li>" + "hub.client.answeredSdp " + "</li>");
    //    var sdp = JSON.parse(SdpJson);
    //    if (sdp) {
    //        pc.setRemoteDescription(new RTCSessionDescription(sdp), function () {}, logError);
    //    }


    //}

    //hub.client.offeredSdp = function (connectionId, username, SdpJson) {
    //    var sdp = JSON.parse(SdpJson);
    //    if (sdp) {
    //        pc.setRemoteDescription(new RTCSessionDescription(sdp), function () {
    //            if (pc.remoteDescription.type == RTCSdpType.offer)
    //                pc.createAnswer(localDescCreated, logError);
    //        }, logError);
    //    }
    //}

    //function localDescCreated(desc) {

    //    createLocalVideoStream();

    //    pc.setLocalDescription(desc, function () {
    //        hub.server.offerSdp(connectionidOther, usernameOther, JSON.stringify({ "sdp": pc.localDescription }))
    //        //signallingChannel.send(JSON.stringify({ "sdp": pc.localDescription }));
    //    }, logError);
    //}









    //function createLocalVideoStream() {


    //}


    function clickForVideoConference(e) {
        connectionidOther = this.dataset["connectionid"];
        usernameOther = this.dataset["username"];
        isInitiatator = true;
        start();

    };


})


