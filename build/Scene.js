// Last time the scene was rendered.
var lastRenderTime = 0;
// Currently active VRDisplay.
var vrDisplay;
// How big of a box to render.
var boxSize = 5;
// Various global THREE.Objects.
var scene;
var cube;
var controls;
var effect;
var camera;
// EnterVRButton for rendering enter/exit UI.
var vrButton;
var plane;
var uniforms;
var speed = 0;
var analyser;
const planeResolution = 14;
var renderer;
var sound;

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

  // Add a repeating grid as a skybox.
  var loader = new THREE.TextureLoader();
  loader.load('assets/box.png', onTextureLoaded);

  // Create 3D objects.
  
  var geometry = new THREE.PlaneGeometry( 100, 100, planeResolution, planeResolution );
  var vertex = document.getElementById('vertexShader').innerHTML;
  var fragment = document.getElementById('fragmentShader').innerHTML;
  uniforms = {
        u_speed: { type: "f", value: 1.0 },
        u_x: { type: "f", value: 0.0 },
        u_time: { type: "f", value: 1.0 },
    };

  // material = new THREE.ShaderMaterial({
  //               vertexShader: vertex,
  //               fragmentShader: fragment,
  //               wireframe: true,
  //               uniforms: uniforms
  //       });
  material = new THREE.MeshBasicMaterial( {color: new THREE.Color( 0xff0088 ), wireframe:true} );
  plane = new THREE.Mesh( geometry, material );
  plane.rotation.x = -Math.PI/2;
  plane.position.set(0, -10, -25);

  scene.add(plane);

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
    //initDaydream();
    sound.play();
  });
  document.getElementById('vr-button').appendChild(vrButton.domElement);
  document.getElementById('vr-button').addEventListener('click', function(){
    //initDaydream();
    sound.play();
  });

  document.getElementById('magic-window').addEventListener('click', function() {
    vrButton.requestEnterFullscreen();
    initDesktop();
    sound.play();
    //initDaydream();
  });
  loadAudio();
  loadModels(2);
}

function onTextureLoaded(texture) {
  // For high end VR devices like Vive and Oculus, take into account the stage
  // parameters provided.
  setupStage();
}

var frameNum = 0;
// Request animation frame loop function
function animate(timestamp) {
  frameNum++;
  uniforms.u_time.value += .01;
  plane.geometry.verticesNeedUpdate = true;
  
  if(frameNum%5 === 0){
    for(var v = 0; v<planeResolution+1; v++){
      for(var i = planeResolution;i>0;i--){
        plane.geometry.vertices[v+((planeResolution+1)*i)].z=plane.geometry.vertices[((planeResolution+1)-v)+((planeResolution+1)*(i-1))].z;
      }
      plane.geometry.vertices[v].z = 0;
      plane.geometry.vertices[v].z=Math.pow(analyser.getFrequencyData()[v]*.01,3);
      plane.geometry.vertices[planeResolution-v].z+=Math.pow(analyser.getFrequencyData()[v]*.01,3);
    }
  }

  var delta = Math.min(timestamp - lastRenderTime, 500);
  lastRenderTime = timestamp;

  // Only update controls if we're presenting.
  if (vrButton.isPresenting()) {
    controls.update();
  }
  // Render the scene.
  effect.render(scene, camera);
  analyser.getFrequencyData();
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

function initDesktop(){
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.enableZoom = false;
}

var analyser;
function loadAudio(){
  //Create an AudioListener and add it to the camera
  var listener = new THREE.AudioListener();
  camera.add( listener );

  // create a global audio source
  sound = new THREE.Audio( listener );

  var audioLoader = new THREE.AudioLoader();

  //Load a sound and set it as the Audio object's buffer
  audioLoader.load( './assets/song.mp3', function( buffer ) {
    sound.setBuffer( buffer );
    sound.setLoop(true);
    sound.setVolume(0.5);
    
  });

  analyser = new THREE.AudioAnalyser( sound, 32 );
  
}
var assets = [];
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

function loadModels(numModels){
  for (var i =0; i<numModels;i++){ 
      (function(index){
          loader.load( './assets/space_obj/' + index + '.obj', function ( object ) { 
              //object.name=load_obj; 
              object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                  child.material = new THREE.MeshBasicMaterial( {color:0x8800ff, wireframe:true} );
                }
              });        
              scene.add( object );  
              object.scale.set( .1, .1, .1 );
              object.position.z-=200;  
              object.visible= false;  
              assets.push(object);     
          }, onProgress, onError ); 
      })(i);
  }
}