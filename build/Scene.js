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
function onLoad() {

  // Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
  // Only enable it if you actually need to.
  var renderer = new THREE.WebGLRenderer({antialias: true});
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
  loader.load('img/box.png', onTextureLoaded);

  // Create 3D objects.
  var geometry = new THREE.PlaneBufferGeometry( 100, 100, 64, 64 );
  var vertex = document.getElementById('vertexShader').innerHTML;
  var fragment = document.getElementById('fragmentShader').innerHTML;
  uniforms = {
        u_speed: { type: "f", value: 1.0 },
        u_x: { type: "f", value: 1.0 },
        u_time: { type: "f", value: 1.0 },
    };

  material = new THREE.ShaderMaterial({
                vertexShader: vertex,
                fragmentShader: fragment,
                wireframe: true,
                uniforms: uniforms
        });
  plane = new THREE.Mesh( geometry, material );
  plane.rotation.x = -Math.PI/2;
  plane.position.set(0, -5, -50);

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
    initDaydream();
  });
  document.getElementById('vr-button').appendChild(vrButton.domElement);
  document.getElementById('vr-button').addEventListener('click', function(){
    initDaydream();
  });

  document.getElementById('magic-window').addEventListener('click', function() {
    vrButton.requestEnterFullscreen();
    initDaydream();
  });
}

function onTextureLoaded(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(boxSize, boxSize);

  var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  var material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0x01BE00,
    side: THREE.BackSide
  });

  // Align the skybox to the floor (which is at y=0).
  skybox = new THREE.Mesh(geometry, material);
  skybox.position.y = boxSize/2;
  //scene.add(skybox);

  // For high end VR devices like Vive and Oculus, take into account the stage
  // parameters provided.
  setupStage();
}



// Request animation frame loop function
function animate(timestamp) {
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

var axis = new THREE.Vector3();
var quaternion = new THREE.Quaternion();
var quaternionHome = new THREE.Quaternion();

var initialised = false;
var timeout = null;

function initDaydream(){
        console.log('init daydream controller')
        var controller = new DaydreamController();
        controller.onStateChange( function ( state ) {
         // console.log(JSON.stringify( state, null, '\t' ));

          if ( cube !== undefined ) {
            var angle = Math.sqrt( state.xOri * state.xOri + state.yOri * state.yOri + state.zOri * state.zOri );
            if ( angle > 0 ) {
              axis.set( state.xOri, state.yOri, state.zOri )
              axis.multiplyScalar( 1 / angle );
              quaternion.setFromAxisAngle( axis, angle );
              if ( initialised === false ) {
                quaternionHome.copy( quaternion );
                quaternionHome.inverse();
                initialised = true;
              }
            } else {
              quaternion.set( 0, 0, 0, 1 );
            }
            if ( state.isHomeDown ) {
              if ( timeout === null ) {
                timeout = setTimeout( function () {
                  quaternionHome.copy( quaternion );
                  quaternionHome.inverse();
                }, 1000 );
              }
            } else {
              if ( timeout !== null ) {
                clearTimeout( timeout );
                timeout = null;
              }
            }
            cube.quaternion.copy( quaternionHome );
            cube.quaternion.multiply( quaternion );
            // button1.material.emissive.g = state.isClickDown ? 0.5 : 0;
            // button2.material.emissive.g = state.isAppDown ? 0.5 : 0;
            // button3.material.emissive.g = state.isHomeDown ? 0.5 : 0;
            // touch.position.x = ( state.xTouch * 2 - 1 ) / 1000;
            // touch.position.y = - ( state.yTouch * 2 - 1 ) / 1000;
            // touch.visible = state.xTouch > 0 && state.yTouch > 0;
           
            //console.log(uniforms.u_x)
          }
           speed = 1-state.yTouch;
          uniforms.u_x.value = -state.yOri;
        } );
        controller.connect();
}