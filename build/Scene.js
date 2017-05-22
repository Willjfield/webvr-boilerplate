// Last time the scene was rendered.
var lastRenderTime = 0;
// Currently active VRDisplay.
var vrDisplay;
// Various global THREE.Objects.
var scene;
var cube;
var controls;
var effect;
var camera;
// EnterVRButton for rendering enter/exit UI.
var vrButton;
//var plane;
var uniforms;
var speed = 0;
var pointLight;
var moveForward = 0;
var renderer;
function onLoad() {
  // Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
  // Only enable it if you actually need to.
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);

  // Append the canvas element created by the renderer to document body element.
  document.body.appendChild(renderer.domElement);

  // Create a three.js scene.
  scene = new THREE.Scene();

  // Create a three.js camera.
  var aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);

  controls = new THREE.VRControls(camera);
  controls.standing = true;
  camera.position.y = controls.userHeight;

  // Apply VR stereo rendering to renderer.
  effect = new THREE.VREffect(renderer);
  effect.setSize(window.innerWidth, window.innerHeight);

  //Lights:
  var skyLight = new THREE.HemisphereLight( 0xffffbb, 0xbbbbff, .1 );
  scene.add( skyLight );

  pointLight = new THREE.PointLight( 0xffffff, 0, 200 );
  scene.add( pointLight );

  // Create 3D objects.
  var manager = new THREE.LoadingManager();
        manager.onProgress = function ( item, loaded, total ) {

          console.log( item, loaded, total );

        };
  var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      console.log( Math.round(percentComplete, 2) + '% downloaded' );
    }
  };

  var onError = function ( xhr ) {
  };
             
  var loader = new THREE.OBJLoader( manager );
        loader.load( 'assets/3d/maze_notex.obj', function ( object ) {

          object.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
              child.material = new THREE.MeshPhongMaterial( {color:0x120811} );
            }
          });

          object.position.y = - 95;
          object.position.x = -64;
          object.scale.y = .5;
          scene.add( object );

          objectWireframe = object.clone();
          objectWireframe.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
              child.material = new THREE.MeshPhongMaterial( {color:0x222222, wireframe: true} );
            }
          });

          objectWireframe.position.y = - 95;
          objectWireframe.position.x = -64;
          objectWireframe.scale.y = .5;
          scene.add( objectWireframe );

        }, onProgress, onError );

  var vertex = document.getElementById('vertexShader').innerHTML;
  var fragment = document.getElementById('fragmentShader').innerHTML;
  uniforms = {
        u_speed: { type: "f", value: 1.0 },
        u_x: { type: "f", value: 1.0 },
        u_time: { type: "f", value: 1.0 },
    };

  // material = new THREE.ShaderMaterial({
  //               vertexShader: vertex,
  //               fragmentShader: fragment,
  //               wireframe: true,
  //               uniforms: uniforms
  //       });
  // plane = new THREE.Mesh( geometry, material );
  // plane.rotation.x = -Math.PI/2;
  // plane.position.set(0, -5, -50);

  // scene.add(plane);

  window.addEventListener('resize', onResize, true);
  window.addEventListener('vrdisplaypresentchange', onResize, true);

  // Initialize the WebVR UI.
  var uiOptions = {
    color: 'black',
    background: 'white',
    corners: 'square'
  };
  vrButton = new webvrui.EnterVRButton(renderer.domElement, uiOptions);
  vrButton.on('exit', function() {
    camera.quaternion.set(0, 0, 0, 1);
    camera.position.set(0, controls.userHeight, 0);
  });
  vrButton.on('hide', function() {
    document.getElementById('ui').style.display = 'none';
  });
  vrButton.on('show', function() {
    document.getElementById('ui').style.display = 'inherit';
    initDaydream();
  });
  document.getElementById('vr-button').appendChild(vrButton.domElement);
  document.getElementById('vr-button').addEventListener('click', function(){
    initDaydream();
  });

  document.getElementById('magic-window').addEventListener('click', function() {
    vrButton.requestEnterFullscreen();
    initDesktop();
  });

  //Turn on speech recognition:
  toggleRecognition();

  // For high end VR devices like Vive and Oculus, take into account the stage
  // parameters provided.
  setupStage();
}

// Request animation frame loop function
function animate(timestamp) {
  pointLight.position.set(camera.position.x,camera.position.y,camera.position.z);
  if(typeof scene.children[2] != 'undefined'){
    scene.children[2].position.x -= camera.getWorldDirection().x*moveForward;
    scene.children[2].position.z -= camera.getWorldDirection().z*moveForward;
  }
  uniforms.u_time.value += speed*.2;
  var delta = Math.min(timestamp - lastRenderTime, 500);
  lastRenderTime = timestamp;

  // Only update controls if we're presenting.
  if (vrButton.isPresenting()) {
    controls.update();
  }
  // Render the scene.
  effect.render(scene, camera);

  vrDisplay.requestAnimationFrame(animate);
}

function onResize(e) {
  effect.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

// Get the HMD, and if we're dealing with something that specifies
// stageParameters, rearrange the scene.
function setupStage() {
  navigator.getVRDisplays().then(function(displays) {
    if (displays.length > 0) {
      vrDisplay = displays[0];
      vrDisplay.requestAnimationFrame(animate);
    }
  });
}

window.addEventListener('load', onLoad);

//DAYDREAM:
var axis = new THREE.Vector3();
var quaternion = new THREE.Quaternion();
var quaternionHome = new THREE.Quaternion();

var initialised = false;
var timeout = null;

function initDaydream(){
        console.log('init daydream controller')
        var controller = new DaydreamController();
        controller.onStateChange( function ( state ) {
          //To see list of what's available from Daydream controller:
         //console.log(JSON.stringify( state, null, '\t' ));

          //if ( cube !== undefined ) {
            // var angle = Math.sqrt( state.xOri * state.xOri + state.yOri * state.yOri + state.zOri * state.zOri );
            // if ( angle > 0 ) {
            //   axis.set( state.xOri, state.yOri, state.zOri )
            //   axis.multiplyScalar( 1 / angle );
            //   quaternion.setFromAxisAngle( axis, angle );
            //   if ( initialised === false ) {
            //     quaternionHome.copy( quaternion );
            //     quaternionHome.inverse();
            //     initialised = true;
            //   }
            // } else {
            //   quaternion.set( 0, 0, 0, 1 );
            // }
            // if ( state.isHomeDown ) {
            //   if ( timeout === null ) {
            //     timeout = setTimeout( function () {
            //       quaternionHome.copy( quaternion );
            //       quaternionHome.inverse();
            //     }, 1000 );
            //   }
            // } else {
            //   if ( timeout !== null ) {
            //     clearTimeout( timeout );
            //     timeout = null;
            //   }
            // }
            // cube.quaternion.copy( quaternionHome );
            // cube.quaternion.multiply( quaternion );
            // button1.material.emissive.g = state.isClickDown ? 0.5 : 0;
            // button2.material.emissive.g = state.isAppDown ? 0.5 : 0;
            // button3.material.emissive.g = state.isHomeDown ? 0.5 : 0;
            // touch.position.x = ( state.xTouch * 2 - 1 ) / 1000;
            // touch.position.y = - ( state.yTouch * 2 - 1 ) / 1000;
            // touch.visible = state.xTouch > 0 && state.yTouch > 0;
            //console.log(uniforms.u_x);
            // console.log('move'+state.yTouch*100)
            // camera.translateZ(state.yTouch*100);
          //}

          if(state.isClickDown){
            moveForward = (1-state.yTouch)*2;
          }else{
            moveForward = 0;
          }
          
          speed = 1-state.yTouch;
          uniforms.u_x.value = -state.yOri;
        } );
        controller.connect();
}

function initDesktop(){
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.enableZoom = false;
  $(window).keydown(function( e ) {
    
    if(e.key === 'w'){
      if(typeof scene.children[2] != 'undefined'){
        console.log(e.key)
       scene.children[2].position.x -= camera.getWorldDirection().x*10;
       scene.children[2].position.z -= camera.getWorldDirection().z*10;
      }
    }
  });
}

//SPEECH RECOGNITION
var final_transcript = '';
var recognizing = false;
var ignore_onend;
var start_timestamp;
if (!('webkitSpeechRecognition' in window)) {
  console.log('no speech recognition detected')
} else {
  var recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = function() {
    recognizing = true;
  };

  recognition.onerror = function(event) {
    console.log(event.error);
  };

  recognition.onend = function() {
    console.log('ended');
    recognizing = false;
    if (ignore_onend) {
      return;
    }
    if (!final_transcript) {
      return;
    }
  };

  recognition.onresult = function(event) {

    var interim_transcript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
    console.log('interim: '+interim_transcript);
    recognizeWords(['marco','polo'],interim_transcript,function(){
      pointLight.intensity = 0;
      pointLight.distance = 0;
       TweenLite.to(pointLight, 1, { 
          intensity: 10,
          distance: 500,
          onComplete: function(){
            TweenLite.to(pointLight, .5, { intensity: 0});
          }
        });
      
    });
  };
}

function toggleRecognition(event) {
  if (recognizing) {
    recognition.stop();
    return;
  }
  final_transcript = '';
  recognition.start();
  ignore_onend = false;
}

//Check spoken words against an array of target words:
function recognizeWords(_word_target, _words_spoken, _callback){
  var targetWordsSpoken = 0;
  var wordsNeeded = _word_target.length;

  _word_target.forEach(function(word){
    if(_words_spoken.toLowerCase().indexOf(word)!=-1){
      targetWordsSpoken++;
    }
  });

  if(targetWordsSpoken === wordsNeeded){
    console.log('You said the magic words!');
    _callback();
  }else{
    return;
  }
  
}