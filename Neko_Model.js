//COLORS
var Colors = {
    //red:0x087830,
	red:0xf25346,
    white:0xd8d0d1,
    brown:0x59332e,
    brownDark:0x23190f,
    pink:0xF5986E,
    yellow:0xf4ce93,
    blue:0x68c3c0,

};

///////////////

// GAME VARIABLES
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

var song = document.createElement('audio');
var song_2 = document.createElement('audio');
var songIsPlaying = 0;
var energyFlag = 0;

function resetGame(){
  game = {speed:0,
          initSpeed:.00035,
          baseSpeed:.00035,
          targetBaseSpeed:.00035,
          incrementSpeedByTime:.0000025,
          incrementSpeedByLevel:.000005,
          distanceForSpeedUpdate:100,
          speedLastUpdate:0,

          distance:0,
          ratioSpeedDistance:50,
          energy:100,
          ratioSpeedEnergy:3,

          level:1,
          levelLastUpdate:0,
          distanceForLevelUpdate:1000,
		  distanceForChangeTime: 250,

          planeDefaultHeight:100,
          planeAmpHeight:80,
          planeAmpWidth:75,
          planeMoveSensivity:0.005,
          planeRotXSensivity:0.0008,
          planeRotZSensivity:0.0004,
          planeFallSpeed:.001,
          planeMinSpeed:1.2,
          planeMaxSpeed:1.6,
          planeSpeed:0,
          nekoCollisionDisplacementX:0,
          nekoCollisionSpeedX:0,

          nekoCollisionDisplacementY:0,
          nekoCollisionSpeedY:0,

          seaRadius:600,
          seaLength:800,
          //seaRotationSpeed:0.006,
          wavesMinAmp : 5,
          wavesMaxAmp : 20,
          wavesMinSpeed : 0.001,
          wavesMaxSpeed : 0.003,

          cameraFarPos:500,
          cameraNearPos:150,
          cameraSensivity:0.002,

          coinDistanceTolerance:15,
          coinValue:3,
          coinsSpeed:.5,
          coinLastSpawn:0,
          distanceForCoinsSpawn:100,

          ennemyDistanceTolerance:10,
          ennemyValue:10,
          ennemiesSpeed:.6,
          ennemyLastSpawn:0,
          distanceForEnnemiesSpawn:50,
		  

          status : "playing",
         };
  playBG('audio/02.mp3');
  fieldLevel.innerHTML = Math.floor(game.level);
}

//THREEJS RELATED VARIABLES

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    renderer,
    container,
    controls;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH,
    mousePos = { x: 0, y: 0 };

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function createScene() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = .1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
    );
  //scene.fog = new THREE.Fog(0xf7d9aa, 100,950);
  nyan_fog(0xf7d9aa);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = game.planeDefaultHeight;
  //camera.lookAt(new THREE.Vector3(0, 400, 0));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);

  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);

  /*
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = -Math.PI / 2;
  controls.maxPolarAngle = Math.PI ;

  //controls.noZoom = true;
  //controls.noPan = true;
  //*/
}

// MOUSE AND SCREEN EVENTS

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH)*2;
  var ty = 1 - (event.clientY / HEIGHT)*2;
  mousePos = {x:tx, y:ty};
}

function handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
}

function handleMouseUp(event){
  if (game.status == "waitingReplay"){
    resetGame();
    hideReplay();
  }
}


function handleTouchEnd(event){
  if (game.status == "waitingReplay"){
    resetGame();
    hideReplay();
  }
}

// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {

  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9) //GRADIENT LOOK

  ambientLight = new THREE.AmbientLight(0xdc8874, .5);

  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  var ch = new THREE.CameraHelper(shadowLight.shadow.camera);

  //scene.add(ch);
  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);

}

//TAIL
var Tail = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "tail";
  this.angleHairs=0;

  var hairGeom = new THREE.BoxGeometry(12,12,5);
  var hairMat = new THREE.MeshLambertMaterial({color:0x999999});
  var hair = new THREE.Mesh(hairGeom, hairMat);
  hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  var hairs = new THREE.Object3D();

  this.hairsTop = new THREE.Object3D();

  for (var i=0; i<12; i++){
    var h = hair.clone();
    var col = i%3;
    var row = Math.floor(i/3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row*4, 0, startPosZ + col*4);
    h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);
  hairs.position.set(-45,-25,0);

  this.mesh.add(hairs);
}

//RAINBOW
var Rainbow = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "rainbow";
  this.angleRainbow=0;

  var rainbowGeom = new THREE.BoxGeometry(100,12,4);
  var rainbowMat_R = new THREE.MeshLambertMaterial({color:0xFF0000});
  var rainbowMat_O = new THREE.MeshLambertMaterial({color:0xFF9900});
  var rainbowMat_Y = new THREE.MeshLambertMaterial({color:0xFFFF00});
  var rainbowMat_G = new THREE.MeshLambertMaterial({color:0x33FF00});
  var rainbowMat_B = new THREE.MeshLambertMaterial({color:0x0099FF});
  var rainbowMat_V = new THREE.MeshLambertMaterial({color:0x6633FF});
  
  var rainbow_R = new THREE.Mesh(rainbowGeom, rainbowMat_R);
  var rainbow_O = new THREE.Mesh(rainbowGeom, rainbowMat_O);
  var rainbow_Y = new THREE.Mesh(rainbowGeom, rainbowMat_Y);
  var rainbow_G = new THREE.Mesh(rainbowGeom, rainbowMat_G);
  var rainbow_B = new THREE.Mesh(rainbowGeom, rainbowMat_B);
  var rainbow_V = new THREE.Mesh(rainbowGeom, rainbowMat_V);
  
  rainbow_R.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  rainbow_O.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  rainbow_Y.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  rainbow_G.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  rainbow_B.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  rainbow_V.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  
  var rainbows_R = new THREE.Object3D();
  var rainbows_O= new THREE.Object3D();
  var rainbows_Y = new THREE.Object3D();
  var rainbows_G = new THREE.Object3D();
  var rainbows_B = new THREE.Object3D();
  var rainbows_V = new THREE.Object3D();

  this.rainbowTop_R = new THREE.Object3D();
  this.rainbowTop_O = new THREE.Object3D();
  this.rainbowTop_Y = new THREE.Object3D();
  this.rainbowTop_G = new THREE.Object3D();
  this.rainbowTop_B = new THREE.Object3D();
  this.rainbowTop_V = new THREE.Object3D();

  for (var i=0; i<12; i++){
    var h_R = rainbow_R.clone();
	var h_O = rainbow_O.clone();
	var h_Y = rainbow_Y.clone();
	var h_G = rainbow_G.clone();
	var h_B = rainbow_B.clone();
	var h_V = rainbow_V.clone();
	
    var col = i%3;
    var row = Math.floor(i/3);
    var startPosZ = -4;
    var startPosX = -4;
	
    h_R.position.set(startPosX + row*5, 0, startPosZ + col*4);
	h_O.position.set(startPosX + row*5, 0, startPosZ + col*4);
	h_Y.position.set(startPosX + row*5, 0, startPosZ + col*4);
	h_G.position.set(startPosX + row*5, 0, startPosZ + col*4);
	h_B.position.set(startPosX + row*5, 0, startPosZ + col*4);
	h_V.position.set(startPosX + row*5, 0, startPosZ + col*4);
    h_R.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
    h_O.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
    h_Y.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
    h_G.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
    h_B.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
    h_V.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
	
    this.rainbowTop_R.add(h_R);
	this.rainbowTop_O.add(h_O);
	this.rainbowTop_Y.add(h_Y);
	this.rainbowTop_G.add(h_G);
	this.rainbowTop_B.add(h_B);
	this.rainbowTop_V.add(h_V);
  }
  rainbows_R.add(this.rainbowTop_R);
  rainbows_R.position.set(-70,0,0);
  
  rainbows_O.add(this.rainbowTop_O);
  rainbows_O.position.set(-70,-12,0);
  
  rainbows_Y.add(this.rainbowTop_Y);
  rainbows_Y.position.set(-70,-24,0);
  
  rainbows_G.add(this.rainbowTop_G);
  rainbows_G.position.set(-70,-36,0);
  
  rainbows_B.add(this.rainbowTop_B);
  rainbows_B.position.set(-70,-48,0);
  
  rainbows_V.add(this.rainbowTop_V);
  rainbows_V.position.set(-70,-60,0);

  this.mesh.add(rainbows_R);
  this.mesh.add(rainbows_O);
  this.mesh.add(rainbows_Y);
  this.mesh.add(rainbows_G);
  this.mesh.add(rainbows_B);
  this.mesh.add(rainbows_V);
}

Rainbow.prototype.updateRainbow = function(){
  //*
   var rainbows_R = this.rainbowTop_R.children;
   var rainbows_O = this.rainbowTop_O.children;
   var rainbows_Y = this.rainbowTop_Y.children;
   var rainbows_G = this.rainbowTop_G.children;
   var rainbows_B = this.rainbowTop_B.children;
   var rainbows_V = this.rainbowTop_V.children;

   var l = rainbows_R.length;
   for (var i=0; i<l; i++)
   {
      var h_R = rainbows_R[i];
	  var h_O = rainbows_O[i];
	  var h_Y = rainbows_Y[i];
	  var h_G = rainbows_G[i];
	  var h_B = rainbows_B[i];
	  var h_V = rainbows_V[i];
	  
      h_R.scale.y = .75 + Math.cos(this.angleRainbow+i/3)*.25;
	  h_O.scale.y = .75 + Math.cos(this.angleRainbow+i/3)*.25;
	  h_Y.scale.y = .75 + Math.cos(this.angleRainbow+i/3)*.25;
	  h_G.scale.y = .75 + Math.cos(this.angleRainbow+i/3)*.25;
	  h_B.scale.y = .75 + Math.cos(this.angleRainbow+i/3)*.25;
	  h_V.scale.y = .75 + Math.cos(this.angleRainbow+i/3)*.25;
   }
  this.angleRainbow += game.speed*deltaTime*40;
  //*/
}

Tail.prototype.updateHairs = function(){
  //*
   var hairs = this.hairsTop.children;

   var l = hairs.length;
   for (var i=0; i<l; i++){
      var h = hairs[i];
      h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25;
   }
  this.angleHairs += game.speed*deltaTime*40;
  //*/
}

var NyanCat = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "nyanCat";

  //CREATE HEAD
	var geomHead = new THREE.BoxGeometry(30,50,50,1,1,1);
	var matHead = new THREE.MeshPhongMaterial({color:0x999999, shading:THREE.FlatShading});
	var nyanHead = new THREE.Mesh(geomHead, matHead);
	//nyanHead.position.y = 100;
	nyanHead.position.x = 40;
	nyanHead.castShadow = true;
	nyanHead.receiveShadow = true;
	this.mesh.add(nyanHead);
	
  //CREATE LEFT EAR
	var geomL_Ear = new THREE.BoxGeometry(5,20,15,1,1,1);
	var matL_Ear = new THREE.MeshPhongMaterial({color:0x999999, shading:THREE.FlatShading});
	var nyanL_Ear = new THREE.Mesh(geomL_Ear, matL_Ear);
	nyanL_Ear.position.x = 40;
	nyanL_Ear.position.y = 25;
	nyanL_Ear.position.z = 15;
	nyanL_Ear.castShadow = true;
	nyanL_Ear.receiveShadow = true;
	this.mesh.add(nyanL_Ear);

  //CREATE RIGHT EAR
	var geomR_Ear = new THREE.BoxGeometry(5,20,15,1,1,1);
	var matR_Ear = new THREE.MeshPhongMaterial({color:0x999999, shading:THREE.FlatShading});
	var nyanR_Ear = new THREE.Mesh(geomR_Ear, matR_Ear);
	nyanR_Ear.position.x = 40;
	nyanR_Ear.position.y = 25;
	nyanR_Ear.position.z = -15;
	nyanR_Ear.castShadow = true;
	nyanR_Ear.receiveShadow = true;
	this.mesh.add(nyanR_Ear);
	
  //CREATE LEFT EYE
	var geomL_Eye = new THREE.BoxGeometry(5,13,13,1,1,1);
	var matL_Eye = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanL_Eye = new THREE.Mesh(geomL_Eye, matL_Eye);
	nyanL_Eye.position.x = 53;
	nyanL_Eye.position.y = 13;
	nyanL_Eye.position.z = 13;
	nyanL_Eye.castShadow = true;
	nyanL_Eye.receiveShadow = true;
	this.mesh.add(nyanL_Eye);

  //CREATE RIGHT EYE
	var geomR_Eye = new THREE.BoxGeometry(5,13,13,1,1,1);
	var matR_Eye = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanR_Eye = new THREE.Mesh(geomR_Eye, matR_Eye);
	nyanR_Eye.position.x = 53;
	nyanR_Eye.position.y = 13;
	nyanR_Eye.position.z = -13;
	nyanR_Eye.castShadow = true;
	nyanR_Eye.receiveShadow = true;
	this.mesh.add(nyanR_Eye);
	
  //CREATE LEFT PUPIL
	var geomL_Pupil = new THREE.BoxGeometry(5,5,5,1,1,1);
	var matL_Pupil = new THREE.MeshPhongMaterial({color:0xFFFFFF, shading:THREE.FlatShading});
	var nyanL_Pupil = new THREE.Mesh(geomL_Pupil, matL_Pupil);
	nyanL_Pupil.position.x = 53;
	nyanL_Pupil.position.y = 16;
	nyanL_Pupil.position.z = 16;
	nyanL_Pupil.castShadow = true;
	nyanL_Pupil.receiveShadow = true;
	this.mesh.add(nyanL_Pupil);

  //CREATE RIGHT PUPIL
	var geomR_Pupil = new THREE.BoxGeometry(5,5,5,1,1,1);
	var matR_Pupil = new THREE.MeshPhongMaterial({color:0xFFFFFF, shading:THREE.FlatShading});
	var nyanR_Pupil = new THREE.Mesh(geomR_Pupil, matR_Pupil);
	nyanR_Pupil.position.x = 53;
	nyanR_Pupil.position.y = 16;
	nyanR_Pupil.position.z = -10;
	nyanR_Pupil.castShadow = true;
	nyanR_Pupil.receiveShadow = true;
	this.mesh.add(nyanR_Pupil);
	
  //CREATE MOUTH
	var geomMouth = new THREE.BoxGeometry(10,25,25,1,1,1);
	var matMouth = new THREE.MeshPhongMaterial({color:0x999999, shading:THREE.FlatShading});
	var nyanMouth = new THREE.Mesh(geomMouth, matMouth);
	nyanMouth.position.x = 60;
	nyanMouth.position.y = -10;
	//nyanMouth.position.z = -15;
	nyanMouth.castShadow = true;
	nyanMouth.receiveShadow = true;
	this.mesh.add(nyanMouth);

  //CREATE NOSE
	var geomNose = new THREE.BoxGeometry(5,5,5,1,1,1);
	var matNose = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanNose = new THREE.Mesh(geomNose, matNose);
	nyanNose.position.x = 63;
	nyanNose.position.y = 0;
	//nyanMouth.position.z = -15;
	nyanNose.castShadow = true;
	nyanNose.receiveShadow = true;
	this.mesh.add(nyanNose);
	
  //CREATE MOUTH CENTER
	var geomMC = new THREE.BoxGeometry(5,10,5,1,1,1);
	var matMC = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanMC = new THREE.Mesh(geomMC, matMC);
	nyanMC.position.x = 62.5;
	nyanMC.position.y = -12;
	//nyanMouth.position.z = -15;
	nyanMC.castShadow = true;
	nyanMC.receiveShadow = true;
	this.mesh.add(nyanMC);

  //CREATE MOUTH LEFT
	var geomML = new THREE.BoxGeometry(5,10,5,1,1,1);
	var matML = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanML = new THREE.Mesh(geomML, matML);
	nyanML.position.x = 62.5;
	nyanML.position.y = -12;
	nyanML.position.z = 10;
	nyanML.castShadow = true;
	nyanML.receiveShadow = true;
	this.mesh.add(nyanML);
	
  //CREATE MOUTH RIGHT
	var geomMR = new THREE.BoxGeometry(5,10,5,1,1,1);
	var matMR = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanMR = new THREE.Mesh(geomMR, matMR);
	nyanMR.position.x = 62.5;
	nyanMR.position.y = -12;
	nyanMR.position.z = -10;
	nyanMR.castShadow = true;
	nyanMR.receiveShadow = true;
	this.mesh.add(nyanMR);
	
  //CREATE MOUTH BRIDGE
	var geomMB = new THREE.BoxGeometry(5,5,20,1,1,1);
	var matMB = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanMB = new THREE.Mesh(geomMB, matMB);
	nyanMB.position.x = 62.5;
	nyanMB.position.y = -15;
	nyanMB.position.z = 0;
	nyanMB.castShadow = true;
	nyanMB.receiveShadow = true;
	this.mesh.add(nyanMB);

  //CREATE LEFT CHEEK
	var geomL_Cheek = new THREE.BoxGeometry(5,13,13,1,1,1);
	var matL_Cheek = new THREE.MeshPhongMaterial({color:0xE99094, shading:THREE.FlatShading});
	var nyanL_Cheek = new THREE.Mesh(geomL_Cheek, matL_Cheek);
	nyanL_Cheek.position.x = 53;
	nyanL_Cheek.position.y = -2;
	nyanL_Cheek.position.z = 18;
	nyanL_Cheek.castShadow = true;
	nyanL_Cheek.receiveShadow = true;
	this.mesh.add(nyanL_Cheek);

  //CREATE RIGHT CHEEK
	var geomR_Cheek = new THREE.BoxGeometry(5,13,13,1,1,1);
	var matR_Cheek = new THREE.MeshPhongMaterial({color:0xE99094, shading:THREE.FlatShading});
	var nyanR_Cheek = new THREE.Mesh(geomR_Cheek, matR_Cheek);
	nyanR_Cheek.position.x = 53;
	nyanR_Cheek.position.y = -2;
	nyanR_Cheek.position.z = -18;
	nyanR_Cheek.castShadow = true;
	nyanR_Cheek.receiveShadow = true;
	this.mesh.add(nyanR_Cheek);

  //CREATE BODY
	var geomBody = new THREE.BoxGeometry(75,80,65,1,1,1);
	//var matBody = new THREE.MeshPhongMaterial({color:0xFFCC99, shading:THREE.FlatShading});
	
	var loader = new THREE.TextureLoader();
	loader.load('img/biscuit.png', (texture) =>
	{
		var matBody = new THREE.MeshBasicMaterial({
			map: texture,
	});

		var nyanBody = new THREE.Mesh(geomBody, matBody);
		nyanBody.position.x = -10;
		nyanBody.position.y = 10;
		//nyanBody.position.z = -18;
		nyanBody.castShadow = true;
		nyanBody.receiveShadow = true;
		this.mesh.add(nyanBody);
	});

  //CREATE ICING LEFT
	var geomIL = new THREE.BoxGeometry(60,65,10,1,1,1);
	var matIL = new THREE.MeshPhongMaterial({color:0xFF99FF, shading:THREE.FlatShading});
	var nyanIL = new THREE.Mesh(geomIL, matIL);
	nyanIL.position.x = -10;
	nyanIL.position.y = 10;
	nyanIL.position.z = 28;
	nyanIL.castShadow = true;
	nyanIL.receiveShadow = true;
	this.mesh.add(nyanIL);
	
  //CREATE ICING RIGHT
	var geomIR = new THREE.BoxGeometry(60,65,10,1,1,1);
	var matIR = new THREE.MeshPhongMaterial({color:0xFF99FF, shading:THREE.FlatShading});
	var nyanIR = new THREE.Mesh(geomIR, matIR);
	nyanIR.position.x = -10;
	nyanIR.position.y = 10;
	nyanIR.position.z = -28;
	nyanIR.castShadow = true;
	nyanIR.receiveShadow = true;
	this.mesh.add(nyanIR);

  //CREATE CANDY LEFT
	var geomCL = new THREE.BoxGeometry(5,5,5,1,1,1);
	var matCL = new THREE.MeshPhongMaterial({color:0xFF3399, shading:THREE.FlatShading});
	var nyanCL_1 = new THREE.Mesh(geomCL, matCL);
	nyanCL_1.position.x = -25;
	nyanCL_1.position.y = -15;
	nyanCL_1.position.z = 30.5;
	nyanCL_1.castShadow = true;
	nyanCL_1.receiveShadow = true;
	this.mesh.add(nyanCL_1);
	
	var nyanCL_2 = new THREE.Mesh(geomCL, matCL);
	nyanCL_2.position.x = -35;
	nyanCL_2.position.y = -5;
	nyanCL_2.position.z = 30.5;
	nyanCL_2.castShadow = true;
	nyanCL_2.receiveShadow = true;
	this.mesh.add(nyanCL_2);
	
	var nyanCL_3 = new THREE.Mesh(geomCL, matCL);
	nyanCL_3.position.x = -25;
	nyanCL_3.position.y = 10;
	nyanCL_3.position.z = 30.5;
	nyanCL_3.castShadow = true;
	nyanCL_3.receiveShadow = true;
	this.mesh.add(nyanCL_3);
	
	var nyanCL_4 = new THREE.Mesh(geomCL, matCL);
	nyanCL_4.position.x = -10;
	nyanCL_4.position.y = -5;
	nyanCL_4.position.z = 30.5;
	nyanCL_4.castShadow = true;
	nyanCL_4.receiveShadow = true;
	this.mesh.add(nyanCL_4);
	
	var nyanCL_5 = new THREE.Mesh(geomCL, matCL);
	nyanCL_5.position.x = 5;
	nyanCL_5.position.y = 35;
	nyanCL_5.position.z = 30.5;
	nyanCL_5.castShadow = true;
	nyanCL_5.receiveShadow = true;
	this.mesh.add(nyanCL_5);
	
	var nyanCL_6 = new THREE.Mesh(geomCL, matCL);
	nyanCL_6.position.x = 15;
	nyanCL_6.position.y = 25;
	nyanCL_6.position.z = 30.5;
	nyanCL_6.castShadow = true;
	nyanCL_6.receiveShadow = true;
	this.mesh.add(nyanCL_6);
	
	var nyanCL_7 = new THREE.Mesh(geomCL, matCL);
	nyanCL_7.position.x = 5;
	nyanCL_7.position.y = 10;
	nyanCL_7.position.z = 30.5;
	nyanCL_7.castShadow = true;
	nyanCL_7.receiveShadow = true;
	this.mesh.add(nyanCL_7);
	
	var nyanCL_8 = new THREE.Mesh(geomCL, matCL);
	nyanCL_8.position.x = -10;
	nyanCL_8.position.y = 25;
	nyanCL_8.position.z = 30.5;
	nyanCL_8.castShadow = true;
	nyanCL_8.receiveShadow = true;
	this.mesh.add(nyanCL_8);
	
	var nyanCL_9 = new THREE.Mesh(geomCL, matCL);
	nyanCL_9.position.x = -25;
	nyanCL_9.position.y = 35;
	nyanCL_9.position.z = 30.5;
	nyanCL_9.castShadow = true;
	nyanCL_9.receiveShadow = true;
	this.mesh.add(nyanCL_9);
	
	var nyanCL_10 = new THREE.Mesh(geomCL, matCL);
	nyanCL_10.position.x = -35;
	nyanCL_10.position.y = 25;
	nyanCL_10.position.z = 30.5;
	nyanCL_10.castShadow = true;
	nyanCL_10.receiveShadow = true;
	this.mesh.add(nyanCL_10);
	
	var nyanCL_11 = new THREE.Mesh(geomCL, matCL);
	nyanCL_11.position.x = 5;
	nyanCL_11.position.y = -15;
	nyanCL_11.position.z = 30.5;
	nyanCL_11.castShadow = true;
	nyanCL_11.receiveShadow = true;
	this.mesh.add(nyanCL_11);
	
	var nyanCL_12 = new THREE.Mesh(geomCL, matCL);
	nyanCL_12.position.x = 15;
	nyanCL_12.position.y = -5;
	nyanCL_12.position.z = 30.5;
	nyanCL_12.castShadow = true;
	nyanCL_12.receiveShadow = true;
	this.mesh.add(nyanCL_12);
	
  //CREATE CANDY RIGHT
	var nyanCR_1 = new THREE.Mesh(geomCL, matCL);
	nyanCR_1.position.x = -25;
	nyanCR_1.position.y = -15;
	nyanCR_1.position.z = -30.5;
	nyanCR_1.castShadow = true;
	nyanCR_1.receiveShadow = true;
	this.mesh.add(nyanCR_1);
	
	var nyanCR_2 = new THREE.Mesh(geomCL, matCL);
	nyanCR_2.position.x = -35;
	nyanCR_2.position.y = -5;
	nyanCR_2.position.z = -30.5;
	nyanCR_2.castShadow = true;
	nyanCR_2.receiveShadow = true;
	this.mesh.add(nyanCR_2);
	
	var nyanCR_3 = new THREE.Mesh(geomCL, matCL);
	nyanCR_3.position.x = -25;
	nyanCR_3.position.y = 10;
	nyanCR_3.position.z = -30.5;
	nyanCR_3.castShadow = true;
	nyanCR_3.receiveShadow = true;
	this.mesh.add(nyanCR_3);
	
	var nyanCR_4 = new THREE.Mesh(geomCL, matCL);
	nyanCR_4.position.x = -10;
	nyanCR_4.position.y = -5;
	nyanCR_4.position.z = -30.5;
	nyanCR_4.castShadow = true;
	nyanCR_4.receiveShadow = true;
	this.mesh.add(nyanCR_4);
	
	var nyanCR_5 = new THREE.Mesh(geomCL, matCL);
	nyanCR_5.position.x = 5;
	nyanCR_5.position.y = 35;
	nyanCR_5.position.z = -30.5;
	nyanCR_5.castShadow = true;
	nyanCR_5.receiveShadow = true;
	this.mesh.add(nyanCR_5);
	
	var nyanCR_6 = new THREE.Mesh(geomCL, matCL);
	nyanCR_6.position.x = 15;
	nyanCR_6.position.y = 25;
	nyanCR_6.position.z = -30.5;
	nyanCR_6.castShadow = true;
	nyanCR_6.receiveShadow = true;
	this.mesh.add(nyanCR_6);
	
	var nyanCR_7 = new THREE.Mesh(geomCL, matCL);
	nyanCR_7.position.x = 5;
	nyanCR_7.position.y = 10;
	nyanCR_7.position.z = -30.5;
	nyanCR_7.castShadow = true;
	nyanCR_7.receiveShadow = true;
	this.mesh.add(nyanCR_7);
	
	var nyanCR_8 = new THREE.Mesh(geomCL, matCL);
	nyanCR_8.position.x = -10;
	nyanCR_8.position.y = 25;
	nyanCR_8.position.z = -30.5;
	nyanCR_8.castShadow = true;
	nyanCR_8.receiveShadow = true;
	this.mesh.add(nyanCR_8);
	
	var nyanCR_9 = new THREE.Mesh(geomCL, matCL);
	nyanCR_9.position.x = -25;
	nyanCR_9.position.y = 35;
	nyanCR_9.position.z = -30.5;
	nyanCR_9.castShadow = true;
	nyanCR_9.receiveShadow = true;
	this.mesh.add(nyanCR_9);
	
	var nyanCR_10 = new THREE.Mesh(geomCL, matCL);
	nyanCR_10.position.x = -35;
	nyanCR_10.position.y = 25;
	nyanCR_10.position.z = -30.5;
	nyanCR_10.castShadow = true;
	nyanCR_10.receiveShadow = true;
	this.mesh.add(nyanCR_10);
	
	var nyanCR_11 = new THREE.Mesh(geomCL, matCL);
	nyanCR_11.position.x = 5;
	nyanCR_11.position.y = -15;
	nyanCR_11.position.z = -30.5;
	nyanCR_11.castShadow = true;
	nyanCR_11.receiveShadow = true;
	this.mesh.add(nyanCR_11);
	
	var nyanCR_12 = new THREE.Mesh(geomCL, matCL);
	nyanCR_12.position.x = 15;
	nyanCR_12.position.y = -5;
	nyanCR_12.position.z = -30.5;
	nyanCR_12.castShadow = true;
	nyanCR_12.receiveShadow = true;
	this.mesh.add(nyanCR_12);
	
  //CREATE LEGS
	var geomLegs = new THREE.BoxGeometry(15,20,15,1,1,1);
	var matLegs = new THREE.MeshPhongMaterial({color:0x999999, shading:THREE.FlatShading});
	
	var nyanLegs_1 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_1.position.x = 10;
	nyanLegs_1.position.y = -32;
	nyanLegs_1.position.z = 15;
	nyanLegs_1.castShadow = true;
	nyanLegs_1.receiveShadow = true;
	this.mesh.add(nyanLegs_1);
	
	var nyanLegs_2 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_2.position.x = 10;
	nyanLegs_2.position.y = -32;
	nyanLegs_2.position.z = -15;
	nyanLegs_2.castShadow = true;
	nyanLegs_2.receiveShadow = true;
	this.mesh.add(nyanLegs_2);
	
	var nyanLegs_3 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_3.position.x = -30;
	nyanLegs_3.position.y = -32;
	nyanLegs_3.position.z = 15;
	nyanLegs_3.castShadow = true;
	nyanLegs_3.receiveShadow = true;
	this.mesh.add(nyanLegs_3);
	
	var nyanLegs_4 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_4.position.x = -30;
	nyanLegs_4.position.y = -32;
	nyanLegs_4.position.z = -15;
	nyanLegs_4.castShadow = true;
	nyanLegs_4.receiveShadow = true;
	this.mesh.add(nyanLegs_4);
	
  this.tail = new Tail();
  this.tail.mesh.position.set(-10,27,0);
  this.mesh.add(this.tail.mesh);
  
  this.rainbow = new Rainbow();
  this.rainbow.mesh.position.set(-10,27,0);
  this.mesh.add(this.rainbow.mesh);


  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;

};

var MouseCoin = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "mouseCoin";

  //CREATE HEAD
	var geomHead_mouse = new THREE.SphereGeometry( 20, 32, 32 );
	var matHead_mouse = new THREE.MeshPhongMaterial({color:0x999896, shading:THREE.FlatShading});
	var nyanHead_mouse= new THREE.Mesh(geomHead_mouse, matHead_mouse);
	//nyanHead.position.y = 100;
	nyanHead_mouse.position.x = 40;
	nyanHead_mouse.castShadow = true;
	nyanHead_mouse.receiveShadow = true;
	this.mesh.add(nyanHead_mouse);
	
  //CREATE MOUTH
	var geomMouth_mouse =new THREE.CylinderGeometry( 17.5, 0, 25, 32 );
	var matMouth_mouse = new THREE.MeshPhongMaterial({color:0x999896, shading:THREE.FlatShading});
	var nyanMouth_mouse = new THREE.Mesh(geomMouth_mouse, matMouth_mouse);
	nyanMouth_mouse.position.x = 61.5;
	nyanMouth_mouse.position.y = 0;
	//nyanMouth.position.z = -15;
	nyanMouth_mouse.rotation.z = 1.5708;
	nyanMouth_mouse.castShadow = true;
	nyanMouth_mouse.receiveShadow = true;
	this.mesh.add(nyanMouth_mouse);
	
  //CREATE LEFT EAR
	//var geomL_Ear = new THREE.BoxGeometry(5,20,15,1,1,1);
	var geomL_Ear_mouse =new THREE.CylinderGeometry( 13, 13, 2.5, 32 );
	var matL_Ear_mouse = new THREE.MeshPhongMaterial({color:0x999896, shading:THREE.FlatShading});
	var nyanL_Ear_mouse = new THREE.Mesh(geomL_Ear_mouse, matL_Ear_mouse);
	nyanL_Ear_mouse.position.x = 40;
	nyanL_Ear_mouse.position.y = 20;
	nyanL_Ear_mouse.position.z = 15;
	nyanL_Ear_mouse.rotation.z = 1.5708;
	nyanL_Ear_mouse.castShadow = true;
	nyanL_Ear_mouse.receiveShadow = true;
	this.mesh.add(nyanL_Ear_mouse);

  //CREATE RIGHT EAR
	var geomR_Ear_mouse =new THREE.CylinderGeometry( 13, 13, 2.5, 32 );
	var matR_Ear_mouse = new THREE.MeshPhongMaterial({color:0x999896, shading:THREE.FlatShading});
	var nyanR_Ear_mouse = new THREE.Mesh(geomR_Ear_mouse, matR_Ear_mouse);
	nyanR_Ear_mouse.position.x = 40;
	nyanR_Ear_mouse.position.y = 20;
	nyanR_Ear_mouse.position.z = -15;
	nyanR_Ear_mouse.rotation.z = 1.5708;
	nyanR_Ear_mouse.castShadow = true;
	nyanR_Ear_mouse.receiveShadow = true;
	this.mesh.add(nyanR_Ear_mouse);

  //CREATE LEFT INNER EAR
	//var geomL_Ear = new THREE.BoxGeometry(5,20,15,1,1,1);
	var geomI_Ear_mouse =new THREE.CylinderGeometry( 8, 8, 2, 32 );
	var matI_Ear_mouse = new THREE.MeshPhongMaterial({color:0xe15f7f, shading:THREE.FlatShading});
	var nyanLI_Ear_mouse = new THREE.Mesh(geomI_Ear_mouse, matI_Ear_mouse);
	nyanLI_Ear_mouse.position.x = 40.45;
	nyanLI_Ear_mouse.position.y = 20;
	nyanLI_Ear_mouse.position.z = 15;
	nyanLI_Ear_mouse.rotation.z = 1.5708;
	nyanLI_Ear_mouse.castShadow = true;
	nyanLI_Ear_mouse.receiveShadow = true;
	this.mesh.add(nyanLI_Ear_mouse);

  //CREATE RIGHT INNER EAR
	var nyanRI_Ear_mouse = new THREE.Mesh(geomI_Ear_mouse, matI_Ear_mouse);
	nyanRI_Ear_mouse.position.x = 40.45;
	nyanRI_Ear_mouse.position.y = 20;
	nyanRI_Ear_mouse.position.z = -15;
	nyanRI_Ear_mouse.rotation.z = 1.5708;
	nyanRI_Ear_mouse.castShadow = true;
	nyanRI_Ear_mouse.receiveShadow = true;
	this.mesh.add(nyanRI_Ear_mouse);
	
  //CREATE LEFT EYE
	var geomEye_mouse = new THREE.SphereGeometry( 5, 32, 32 );
	var matEye_mouse = new THREE.MeshPhongMaterial({color:0xFFFFFF, shading:THREE.FlatShading});
	var nyanL_Eye_mouse = new THREE.Mesh(geomEye_mouse, matEye_mouse);
	nyanL_Eye_mouse.position.x = 53;
	nyanL_Eye_mouse.position.y = 13;
	nyanL_Eye_mouse.position.z = 13;
	nyanL_Eye_mouse.castShadow = true;
	nyanL_Eye_mouse.receiveShadow = true;
	this.mesh.add(nyanL_Eye_mouse);

  //CREATE RIGHT EYE
	var nyanR_Eye_mouse = new THREE.Mesh(geomEye_mouse, matEye_mouse);
	nyanR_Eye_mouse.position.x = 53;
	nyanR_Eye_mouse.position.y = 13;
	nyanR_Eye_mouse.position.z = -13;
	nyanR_Eye_mouse.castShadow = true;
	nyanR_Eye_mouse.receiveShadow = true;
	this.mesh.add(nyanR_Eye_mouse);
	
  //CREATE LEFT PUPIL
    var geomPupil_mouse = new THREE.SphereGeometry( 3, 32, 32 );
	var matPupil_mouse = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanL_Pupil_mouse = new THREE.Mesh(geomPupil_mouse, matPupil_mouse);
	nyanL_Pupil_mouse.position.x = 55.5;
	nyanL_Pupil_mouse.position.y = 13;
	nyanL_Pupil_mouse.position.z = 13;
	nyanL_Pupil_mouse.castShadow = true;
	nyanL_Pupil_mouse.receiveShadow = true;
	this.mesh.add(nyanL_Pupil_mouse);

  //CREATE RIGHT PUPIL
	var nyanR_Pupil_mouse = new THREE.Mesh(geomPupil_mouse, matPupil_mouse);
	nyanR_Pupil_mouse.position.x = 55.5;
	nyanR_Pupil_mouse.position.y = 13;
	nyanR_Pupil_mouse.position.z = -13;
	nyanR_Pupil_mouse.castShadow = true;
	nyanR_Pupil_mouse.receiveShadow = true;
	this.mesh.add(nyanR_Pupil_mouse);

  //CREATE NOSE
	//var geomNose = new THREE.BoxGeometry(5,5,5,1,1,1);
	var geomNose_mouse =new THREE.CylinderGeometry( 5.5, 0, 10, 32 );
	var matNose_mouse = new THREE.MeshPhongMaterial({color:0xe15f7f, shading:THREE.FlatShading});
	var nyanNose_mouse = new THREE.Mesh(geomNose_mouse, matNose_mouse);
	nyanNose_mouse.position.x = 70;
	nyanNose_mouse.position.y = 0;
	//nyanMouth.position.z = -15;
	nyanNose_mouse.rotation.z = 1.5708;
	nyanNose_mouse.castShadow = true;
	nyanNose_mouse.receiveShadow = true;
	this.mesh.add(nyanNose_mouse);
	
  //CREATE MOUTH CENTER
	var geomMC_mouse = new THREE.BoxGeometry(2,2,8,1,1,1);
	var matMC_mouse = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanMC_mouse = new THREE.Mesh(geomMC_mouse, matMC_mouse);
	nyanMC_mouse.position.x = 63;
	nyanMC_mouse.position.y = -8;
	//nyanMouth.position.z = -15;
	nyanMC_mouse.castShadow = true;
	nyanMC_mouse.receiveShadow = true;
	this.mesh.add(nyanMC_mouse);

  //CREATE TEETH
	var geomTeeth_mouse = new THREE.BoxGeometry(2,3,3,1,1,1);
	var matTeeth_mouse = new THREE.MeshPhongMaterial({color:0xFFFFFF, shading:THREE.FlatShading});
	var nyanTeeth_mouse = new THREE.Mesh(geomTeeth_mouse, matTeeth_mouse);
	nyanTeeth_mouse.position.x = 63;
	nyanTeeth_mouse.position.y = -10;
	//nyanTeeth_mouse.position.z = 10;
	nyanTeeth_mouse.castShadow = true;
	nyanTeeth_mouse.receiveShadow = true;
	this.mesh.add(nyanTeeth_mouse);

  //CREATE BODY
	//var geomBody = new THREE.BoxGeometry(75,80,65,1,1,1);
	var geomBody = new THREE.SphereGeometry( 30, 32, 32 );
	var matBody = new THREE.MeshPhongMaterial({color:0x999896, shading:THREE.FlatShading});
	var nyanBody = new THREE.Mesh(geomBody, matBody);
	nyanBody.position.x = 0;
	nyanBody.position.y = 10;
	//nyanBody.position.z = -18;
	nyanBody.castShadow = true;
	nyanBody.receiveShadow = true;
	this.mesh.add(nyanBody);
	
  //CREATE LEGS
	var geomLegs =new THREE.CylinderGeometry( 5, 5, 12, 32 );
	var matLegs = new THREE.MeshPhongMaterial({color:0x999999, shading:THREE.FlatShading});
	var nyanLegs_1 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_1.position.x = 10;
	nyanLegs_1.position.y = -14;
	nyanLegs_1.position.z = 15;
	nyanLegs_1.castShadow = true;
	nyanLegs_1.receiveShadow = true;
	this.mesh.add(nyanLegs_1);
	
	var nyanLegs_2 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_2.position.x = 10;
	nyanLegs_2.position.y = -14;
	nyanLegs_2.position.z = -15;
	nyanLegs_2.castShadow = true;
	nyanLegs_2.receiveShadow = true;
	this.mesh.add(nyanLegs_2);
	
	var nyanLegs_3 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_3.position.x = -12.5;
	nyanLegs_3.position.y = -14;
	nyanLegs_3.position.z = 15;
	nyanLegs_3.castShadow = true;
	nyanLegs_3.receiveShadow = true;
	this.mesh.add(nyanLegs_3);
	
	var nyanLegs_4 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_4.position.x = -12.5;
	nyanLegs_4.position.y = -14;
	nyanLegs_4.position.z = -15;
	nyanLegs_4.castShadow = true;
	nyanLegs_4.receiveShadow = true;
	this.mesh.add(nyanLegs_4);


  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;

};

var EnemyDog = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "enemyDog";

  //CREATE HEAD
	var geomHeadL = new THREE.BoxGeometry(30,50,50,1,1,1);
	var matHeadL = new THREE.MeshPhongMaterial({color:0xf2eba7, shading:THREE.FlatShading});
	var nyanHeadL = new THREE.Mesh(geomHeadL, matHeadL);
	//nyanHead.position.y = 100;
	nyanHeadL.position.x = 40;
	nyanHeadL.castShadow = true;
	nyanHeadL.receiveShadow = true;
	this.mesh.add(nyanHeadL);
	
	var geomHead = new THREE.BoxGeometry(30,30,50,1,1,1);
	var matHead = new THREE.MeshPhongMaterial({color:0xf5ad5c, shading:THREE.FlatShading});
	var nyanHead = new THREE.Mesh(geomHead, matHead);
	nyanHead.position.y = 10;
	nyanHead.position.x = 40;
	nyanHead.castShadow = true;
	nyanHead.receiveShadow = true;
	this.mesh.add(nyanHead);
	
  //CREATE MOUTH
    var geomMouthL = new THREE.BoxGeometry(20,25,25,1,1,1);
	var matMouthL = new THREE.MeshPhongMaterial({color:0xf2eba7, shading:THREE.FlatShading});
	var nyanMouthL = new THREE.Mesh(geomMouthL, matMouthL);
	nyanMouthL.position.x = 60;
	nyanMouthL.position.y = -10;
	//nyanMouth.position.z = -15;
	nyanMouthL.castShadow = true;
	nyanMouthL.receiveShadow = true;
	this.mesh.add(nyanMouthL);

  //CREATE NOSE
	var geomNose = new THREE.BoxGeometry(5,5,8,1,1,1);
	var matNose = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanNose = new THREE.Mesh(geomNose, matNose);
	nyanNose.position.x = 67.5;
	nyanNose.position.y = 0;
	nyanNose.castShadow = true;
	nyanNose.receiveShadow = true;
	this.mesh.add(nyanNose);
	
  //CREATE MOUTH CENTER
	var geomMC = new THREE.BoxGeometry(5,10,5,1,1,1);
	var matMC = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanMC = new THREE.Mesh(geomMC, matMC);
	nyanMC.position.x = 67.5;
	nyanMC.position.y = -7;
	//nyanMouth.position.z = -15;
	nyanMC.castShadow = true;
	nyanMC.receiveShadow = true;
	this.mesh.add(nyanMC);

  //CREATE MOUTH LEFT
	var geomML = new THREE.BoxGeometry(5,10,5,1,1,1);
	var matML = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanML = new THREE.Mesh(geomML, matML);
	nyanML.position.x = 67.5;
	nyanML.position.y = -7;
	nyanML.position.z = 10;
	nyanML.castShadow = true;
	nyanML.receiveShadow = true;
	this.mesh.add(nyanML);
	
  //CREATE MOUTH RIGHT
	var geomMR = new THREE.BoxGeometry(5,10,5,1,1,1);
	var matMR = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanMR = new THREE.Mesh(geomMR, matMR);
	nyanMR.position.x = 67.5;
	nyanMR.position.y = -7;
	nyanMR.position.z = -10;
	nyanMR.castShadow = true;
	nyanMR.receiveShadow = true;
	this.mesh.add(nyanMR);
	
  //CREATE MOUTH BRIDGE
	var geomMB = new THREE.BoxGeometry(5,5,20,1,1,1);
	var matMB = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanMB = new THREE.Mesh(geomMB, matMB);
	nyanMB.position.x = 67.5;
	nyanMB.position.y = -10;
	nyanMB.position.z = 0;
	nyanMB.castShadow = true;
	nyanMB.receiveShadow = true;
	this.mesh.add(nyanMB);

  //CREATE TOUNGE
	var geomTounge = new THREE.BoxGeometry(5,8,8,1,1,1);
	var matTounge = new THREE.MeshPhongMaterial({color:0xf591af, shading:THREE.FlatShading});
	var nyanTounge = new THREE.Mesh(geomTounge, matTounge);
	nyanTounge.position.x = 67.5;
	nyanTounge.position.y = -16;
	//nyanMouth.position.z = -15;
	nyanTounge.castShadow = true;
	nyanTounge.receiveShadow = true;
	this.mesh.add(nyanTounge);
	
  //CREATE LEFT EAR
	var geomEar = new THREE.BoxGeometry(5,20,15,1,1,1);
	var matEar = new THREE.MeshPhongMaterial({color:0xf5ad5c, shading:THREE.FlatShading});
	var nyanL_Ear = new THREE.Mesh(geomEar, matEar);
	nyanL_Ear.position.x = 40;
	nyanL_Ear.position.y = 28;
	nyanL_Ear.position.z = 15;
	nyanL_Ear.castShadow = true;
	nyanL_Ear.receiveShadow = true;
	this.mesh.add(nyanL_Ear);

  //CREATE RIGHT EAR
	var nyanR_Ear = new THREE.Mesh(geomEar, matEar);
	nyanR_Ear.position.x = 40;
	nyanR_Ear.position.y = 28;
	nyanR_Ear.position.z = -15;
	nyanR_Ear.castShadow = true;
	nyanR_Ear.receiveShadow = true;
	this.mesh.add(nyanR_Ear);

  //CREATE LEFT EAR DETAIL
	var geomEarD = new THREE.BoxGeometry(5,20,10,1,1,1);
	var matEarD = new THREE.MeshPhongMaterial({color:0xf2eba7, shading:THREE.FlatShading});
	var nyanL_EarD = new THREE.Mesh(geomEarD, matEarD);
	nyanL_EarD.position.x = 40;
	nyanL_EarD.position.y = 24.5;
	nyanL_EarD.position.z = 15;
	nyanL_EarD.castShadow = true;
	nyanL_EarD.receiveShadow = true;
	this.mesh.add(nyanL_EarD);

  //CREATE RIGHT EAR DETAIL
	var nyanR_EarD = new THREE.Mesh(geomEarD, matEarD);
	nyanR_EarD.position.x = 40;
	nyanR_EarD.position.y = 24.5;
	nyanR_EarD.position.z = -15;
	nyanR_EarD.castShadow = true;
	nyanR_EarD.receiveShadow = true;
	this.mesh.add(nyanR_EarD);
	
  //CREATE LEFT EYE
	var geomEye = new THREE.BoxGeometry(5,10,10,1,1,1);
	var matEye = new THREE.MeshPhongMaterial({color:0x000000, shading:THREE.FlatShading});
	var nyanL_Eye = new THREE.Mesh(geomEye, matEye);
	nyanL_Eye.position.x = 53;
	nyanL_Eye.position.y = 8;
	nyanL_Eye.position.z = 13;
	nyanL_Eye.castShadow = true;
	nyanL_Eye.receiveShadow = true;
	this.mesh.add(nyanL_Eye);

  //CREATE RIGHT EYE
	var nyanR_Eye = new THREE.Mesh(geomEye, matEye);
	nyanR_Eye.position.x = 53;
	nyanR_Eye.position.y = 8;
	nyanR_Eye.position.z = -13;
	nyanR_Eye.castShadow = true;
	nyanR_Eye.receiveShadow = true;
	this.mesh.add(nyanR_Eye);
	
  //CREATE LEFT PUPIL
	var geomPupil = new THREE.BoxGeometry(5,5,5,1,1,1);
	var matPupil = new THREE.MeshPhongMaterial({color:0xFFFFFF, shading:THREE.FlatShading});
	var nyanL_Pupil = new THREE.Mesh(geomPupil, matPupil);
	nyanL_Pupil.position.x = 53;
	nyanL_Pupil.position.y = 11;
	nyanL_Pupil.position.z = 16;
	nyanL_Pupil.castShadow = true;
	nyanL_Pupil.receiveShadow = true;
	this.mesh.add(nyanL_Pupil);

  //CREATE RIGHT PUPIL
	var nyanR_Pupil = new THREE.Mesh(geomPupil, matPupil);
	nyanR_Pupil.position.x = 53;
	nyanR_Pupil.position.y = 11;
	nyanR_Pupil.position.z = -10;
	nyanR_Pupil.castShadow = true;
	nyanR_Pupil.receiveShadow = true;
	this.mesh.add(nyanR_Pupil);

  //CREATE LEFT EYEBROW
	var geomEyebrow = new THREE.BoxGeometry(5,5,8,1,1,1);
	var matEyebrow = new THREE.MeshPhongMaterial({color:0xf2eba7, shading:THREE.FlatShading});
	var nyanL_Eyebrow = new THREE.Mesh(geomEyebrow, matEyebrow);
	nyanL_Eyebrow.position.x = 53;
	nyanL_Eyebrow.position.y = 18;
	nyanL_Eyebrow.position.z = 10;
	nyanL_Eyebrow.castShadow = true;
	nyanL_Eyebrow.receiveShadow = true;
	this.mesh.add(nyanL_Eyebrow);

  //CREATE RIGHT EYEBROW
	var nyanR_Eyebrow = new THREE.Mesh(geomEyebrow, matEyebrow);
	nyanR_Eyebrow.position.x = 53;
	nyanR_Eyebrow.position.y = 18;
	nyanR_Eyebrow.position.z = -10;
	nyanR_Eyebrow.castShadow = true;
	nyanR_Eyebrow.receiveShadow = true;
	this.mesh.add(nyanR_Eyebrow);

  //CREATE BODY
	var geomBodyL = new THREE.BoxGeometry(65,60,65,1,1,1);
	var matBodyL = new THREE.MeshPhongMaterial({color:0xf2eba7, shading:THREE.FlatShading});
	var nyanBodyL = new THREE.Mesh(geomBodyL, matBodyL);
	nyanBodyL.position.x = -10;
	nyanBodyL.position.y = 0;
	//nyanBody.position.z = -18;
	nyanBodyL.castShadow = true;
	nyanBodyL.receiveShadow = true;
	this.mesh.add(nyanBodyL);
	
	var geomBody = new THREE.BoxGeometry(65,40,65,1,1,1);
	var matBody = new THREE.MeshPhongMaterial({color:0xf5ad5c, shading:THREE.FlatShading});
	var nyanBody = new THREE.Mesh(geomBody, matBody);
	nyanBody.position.x = -10;
	nyanBody.position.y = 10;
	//nyanBody.position.z = -18;
	nyanBody.castShadow = true;
	nyanBody.receiveShadow = true;
	this.mesh.add(nyanBody);

  //CREATE LEGS
	var geomLegs = new THREE.BoxGeometry(15,20,15,1,1,1);
	var matLegs = new THREE.MeshPhongMaterial({color:0xf5ad5c, shading:THREE.FlatShading});
	var nyanLegs_1 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_1.position.x = 10;
	nyanLegs_1.position.y = -32;
	nyanLegs_1.position.z = 15;
	nyanLegs_1.castShadow = true;
	nyanLegs_1.receiveShadow = true;
	this.mesh.add(nyanLegs_1);
	
	var nyanLegs_2 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_2.position.x = 10;
	nyanLegs_2.position.y = -32;
	nyanLegs_2.position.z = -15;
	nyanLegs_2.castShadow = true;
	nyanLegs_2.receiveShadow = true;
	this.mesh.add(nyanLegs_2);
	
	var nyanLegs_3 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_3.position.x = -30;
	nyanLegs_3.position.y = -32;
	nyanLegs_3.position.z = 15;
	nyanLegs_3.castShadow = true;
	nyanLegs_3.receiveShadow = true;
	this.mesh.add(nyanLegs_3);
	
	var nyanLegs_4 = new THREE.Mesh(geomLegs, matLegs);
	nyanLegs_4.position.x = -30;
	nyanLegs_4.position.y = -32;
	nyanLegs_4.position.z = -15;
	nyanLegs_4.castShadow = true;
	nyanLegs_4.receiveShadow = true;
	this.mesh.add(nyanLegs_4);


  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;

};

Sky = function(){
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;
  this.clouds = [];
  var stepAngle = Math.PI*2 / this.nClouds;
  for(var i=0; i<this.nClouds; i++){
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle*i;
    var h = game.seaRadius + 150 + Math.random()*200;
    c.mesh.position.y = Math.sin(a)*h;
    c.mesh.position.x = Math.cos(a)*h;
    c.mesh.position.z = -300-Math.random()*500;
    c.mesh.rotation.z = a + Math.PI/2;
    var s = 1+Math.random()*2;
    c.mesh.scale.set(s,s,s);
    this.mesh.add(c.mesh);
  }
}

Sky.prototype.moveClouds = function(){
  for(var i=0; i<this.nClouds; i++){
    var c = this.clouds[i];
    c.rotate();
  }
  this.mesh.rotation.z += game.speed*deltaTime;

}

Sea = function(){
  var geom = new THREE.CylinderGeometry(game.seaRadius,game.seaRadius,game.seaLength,40,10);
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  geom.mergeVertices();
  var l = geom.vertices.length;

  this.waves = [];

  for (var i=0;i<l;i++){
    var v = geom.vertices[i];
    //v.y = Math.random()*30;
    this.waves.push({y:v.y,
                     x:v.x,
                     z:v.z,
                     ang:Math.random()*Math.PI*2,
                     amp:game.wavesMinAmp + Math.random()*(game.wavesMaxAmp-game.wavesMinAmp),
                     speed:game.wavesMinSpeed + Math.random()*(game.wavesMaxSpeed - game.wavesMinSpeed)
                    });
  };
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.blue,
    transparent:true,
    opacity:.8,
    shading:THREE.FlatShading,

  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = "waves";
  this.mesh.receiveShadow = true;

}

Sea.prototype.moveWaves = function (){
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;
  for (var i=0; i<l; i++){
    var v = verts[i];
    var vprops = this.waves[i];
    v.x =  vprops.x + Math.cos(vprops.ang)*vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;
    vprops.ang += vprops.speed*deltaTime;
    this.mesh.geometry.verticesNeedUpdate=true;
  }
}

Cloud = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  //var geom = new THREE.CubeGeometry(20,20,20);
  var geom = new THREE.DodecahedronGeometry(20,0);
  //var geom = new THREE.SphereGeometry( 20, 32, 32 );
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.white,

  });

  //*
  var nBlocs = 3+Math.floor(Math.random()*3);
  for (var i=0; i<nBlocs; i++ ){
    var m = new THREE.Mesh(geom.clone(), mat);
    m.position.x = i*15;
    m.position.y = Math.random()*10;
    m.position.z = Math.random()*10;
    m.rotation.z = Math.random()*Math.PI*2;
    m.rotation.y = Math.random()*Math.PI*2;
    var s = .1 + Math.random()*.9;
    m.scale.set(s,s,s);
    this.mesh.add(m);
    m.castShadow = true;
    m.receiveShadow = true;

  }
  //*/
}

Cloud.prototype.rotate = function(){
  var l = this.mesh.children.length;
  for(var i=0; i<l; i++){
    var m = this.mesh.children[i];
    m.rotation.z+= Math.random()*.005*(i+1);
    m.rotation.y+= Math.random()*.002*(i+1);
  }
}

Ennemy = function(){
  var geom = new THREE.TetrahedronGeometry(8,2);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.red,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });

  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

EnnemiesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function(){
  var nEnnemies = game.level;

  for (var i=0; i<nEnnemies; i++){
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    }else{
      //ennemy = new Ennemy();
	  ennemy = new EnemyDog();
	  ennemy.mesh.scale.set(.2,.2,.2);
	  ennemy.mesh.rotation.y = 3.14159;
    }

    ennemy.angle = - (i*0.1);
    ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
}

EnnemiesHolder.prototype.rotateEnnemies = function(){
  for (var i=0; i<this.ennemiesInUse.length; i++){
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed*deltaTime*game.ennemiesSpeed;

    if (ennemy.angle > Math.PI*2) ennemy.angle -= Math.PI*2;

    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    //ennemy.mesh.rotation.z += Math.random()*.1;
    //ennemy.mesh.rotation.y += Math.random()*.1;

    //var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
    var diffPos = nyancat.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.ennemyDistanceTolerance){
      particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);

      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      game.nekoCollisionSpeedX = 100 * diffPos.x / d;
      game.nekoCollisionSpeedY = 100 * diffPos.y / d;
      ambientLight.intensity = 2;

      removeEnergy();
      i--;
    }else if (ennemy.angle > Math.PI){
      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
}

Particle = function(){
  var geom = new THREE.TetrahedronGeometry(3,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
}

Particle.prototype.explode = function(pos, color, scale){
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color( color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random()*2)*50;
  var targetY = pos.y + (-1 + Math.random()*2)*50;
  var speed = .6+Math.random()*.2;
  TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12});
  TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
  TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:Power2.easeOut, onComplete:function(){
      if(_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1,1,1);
      particlesPool.unshift(_this);
    }});
}

ParticlesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){

  var nPArticles = density;
  for (var i=0; i<nPArticles; i++){
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    }else{
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos,color, scale);
  }
}

/*
Coin = function(){
  //var geom = new THREE.TetrahedronGeometry(5,0);
  var geom= new THREE.TorusGeometry( 5, 2, 16, 100 );
  var mat = new THREE.MeshPhongMaterial({
    //color:0x009999,
	color:0xFFCF40,
    shininess:0,
    specular:0xffffff,

    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}
*/

CoinsHolder = function (nCoins){
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i=0; i<nCoins; i++){
    //var coin = new Coin();
	var coin = new MouseCoin();
	coin.mesh.scale.set(.125,.125,.125);
	coin.mesh.rotation.y = 3.14159;
    this.coinsPool.push(coin);
  }
}

CoinsHolder.prototype.spawnCoins = function(){

  var nCoins = 1 + Math.floor(Math.random()*10);
  var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
  var amplitude = 10 + Math.round(Math.random()*10);
  for (var i=0; i<nCoins; i++){
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    }else{
      coin = new MouseCoin();
	  coin.mesh.scale.set(.125,.125,.125);
	  coin.mesh.rotation.y = 3.14159;
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = - (i*0.02);
    coin.distance = d + Math.cos(i*.5)*amplitude;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
  }
}

CoinsHolder.prototype.rotateCoins = function(){
  for (var i=0; i<this.coinsInUse.length; i++){
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += game.speed*deltaTime*game.coinsSpeed;
    if (coin.angle>Math.PI*2) coin.angle -= Math.PI*2;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
    //coin.mesh.rotation.z += Math.random()*.1;
    //coin.mesh.rotation.y += Math.random()*.1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    var diffPos = nyancat.mesh.position.clone().sub(coin.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.coinDistanceTolerance){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0xFFCF40, .8);
      addEnergy();
      i--;
    }else if (coin.angle > Math.PI){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      i--;
    }
  }
}


// 3D Models
var sea;
var nyancat;

function createNeko(){
  nyancat = new NyanCat();
  nyancat.mesh.scale.set(.25,.25,.25);
  nyancat.mesh.position.y = game.planeDefaultHeight;
  scene.add(nyancat.mesh);
}

function createSea(){
  sea = new Sea();
  sea.mesh.position.y = -game.seaRadius;
  scene.add(sea.mesh);
}

function createSky(){
  sky = new Sky();
  sky.mesh.position.y = -game.seaRadius;
  scene.add(sky.mesh);
}

function createCoins(){

  coinsHolder = new CoinsHolder(20);
  scene.add(coinsHolder.mesh)
}

function createEnnemies(){
  for (var i=0; i<10; i++){
    //var ennemy = new Ennemy();
	ennemy = new EnemyDog();
	ennemy.mesh.scale.set(.2,.2,.2);
	ennemy.mesh.rotation.y = 3.14159;
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(ennemiesHolder.mesh)
}

function createParticles(){
  for (var i=0; i<10; i++){
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(particlesHolder.mesh)
}

function loop(){
	
  setupKeyControls();
  //checkEnergy();

  newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;

  if (game.status=="playing"){
	 
    // Add energy coins every 100m;
    if (Math.floor(game.distance)%game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn){
      game.coinLastSpawn = Math.floor(game.distance);
      coinsHolder.spawnCoins();
    }

    if (Math.floor(game.distance)%game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime*deltaTime;
    }


    if (Math.floor(game.distance)%game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn){
      game.ennemyLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }

    if (Math.floor(game.distance)%game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate){
      game.levelLastUpdate = Math.floor(game.distance);
      game.level++;
      fieldLevel.innerHTML = Math.floor(game.level);

      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel*game.level
    }
	
	if (Math.floor(game.distance)%game.distanceForChangeTime == 0 && Math.floor(game.distance) > game.levelLastUpdate && songIsPlaying == 0){
      skyTime();
    }
	
    updateNeko();
    updateDistance();
    updateEnergy();
	
	//checkEnergy(energyFlag);
	
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.planeSpeed;

  }else if(game.status=="gameover"){
    game.speed *= .99;
    nyancat.mesh.rotation.z += (-Math.PI/2 - nyancat.mesh.rotation.z)*.0002*deltaTime;
    nyancat.mesh.rotation.x += 0.0003*deltaTime;
    game.planeFallSpeed *= 1.05;
    nyancat.mesh.position.y -= game.planeFallSpeed*deltaTime;

    if (nyancat.mesh.position.y <-200){
      showReplay();
      game.status = "waitingReplay";

    }
  }else if (game.status=="waitingReplay"){

  }

  sea.mesh.rotation.z += game.speed*deltaTime;//*game.seaRotationSpeed;

  if ( sea.mesh.rotation.z > 2*Math.PI)  sea.mesh.rotation.z -= 2*Math.PI;

  ambientLight.intensity += (.5 - ambientLight.intensity)*deltaTime*0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();

  sky.moveClouds();
  sea.moveWaves();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updateDistance(){
  game.distance += game.speed*deltaTime*game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
  var d = 502*(1-(game.distance%game.distanceForLevelUpdate)/game.distanceForLevelUpdate);
  levelCircle.setAttribute("stroke-dashoffset", d);

}

var blinkEnergy=false;

function updateEnergy(){
  game.energy -= game.speed*deltaTime*game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);
  energyBar.style.right = (100-game.energy)+"%";
  energyBar.style.backgroundColor = (game.energy<50)? "#f25346" : "#68c3c0";

  if (game.energy<30){
	energyFlag = 1;
    energyBar.style.animationName = "blinking";
  }else{
	energyFlag = 0;
    energyBar.style.animationName = "none";
  }

  if (game.energy <1){
    game.status = "gameover";
  }
}

function addEnergy(){
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);
}

function removeEnergy(){
  game.energy -= game.ennemyValue;
  game.energy = Math.max(0, game.energy);
}



function updateNeko(){

  //game.planeSpeed = normalize(mousePos.x,-.5,.5,game.planeMinSpeed, game.planeMaxSpeed);
  //console.log(game.planeSpeed);
  var targetY = normalize(mousePos.y,-.75,.75,game.planeDefaultHeight-game.planeAmpHeight, game.planeDefaultHeight+game.planeAmpHeight);
  //var targetX = normalize(mousePos.x,-1,1,-game.planeAmpWidth*.7, -game.planeAmpWidth);
  var targetX = normalize(mousePos.x,-1,1,-game.planeAmpWidth*.0125, -game.planeAmpWidth);

  game.nekoCollisionDisplacementX += game.nekoCollisionSpeedX;
  targetX += game.nekoCollisionDisplacementX;


  game.nekoCollisionDisplacementY += game.nekoCollisionSpeedY;
  targetY += game.nekoCollisionDisplacementY;

  nyancat.mesh.position.y += (targetY-nyancat.mesh.position.y)*deltaTime*game.planeMoveSensivity;
  nyancat.mesh.position.x += (targetX-nyancat.mesh.position.x)*deltaTime*game.planeMoveSensivity;

  nyancat.mesh.rotation.z = (targetY-nyancat.mesh.position.y)*deltaTime*game.planeRotXSensivity;
  //nyancat.mesh.rotation.x = (nyancat.mesh.position.y-targetY)*deltaTime*game.planeRotZSensivity;
  var targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed, game.cameraNearPos, game.cameraFarPos);
  
  //CAMERA FOV
  //camera.fov = normalize(mousePos.x,-1,1,40, 80);
  //camera.updateProjectionMatrix ()
  
  camera.position.y += (nyancat.mesh.position.y - camera.position.y)*deltaTime*game.cameraSensivity;

  game.nekoCollisionSpeedX += (0-game.nekoCollisionSpeedX)*deltaTime * 0.03;
  game.nekoCollisionDisplacementX += (0-game.nekoCollisionDisplacementX)*deltaTime *0.01;
  game.nekoCollisionSpeedY += (0-game.nekoCollisionSpeedY)*deltaTime * 0.03;
  game.nekoCollisionDisplacementY += (0-game.nekoCollisionDisplacementY)*deltaTime *0.01;

  nyancat.rainbow.updateRainbow();
  nyancat.tail.updateHairs();
}

function updateFlightSpeed(set){
  game.planeSpeed = normalize(set,-.5,.5,game.planeMinSpeed, game.planeMaxSpeed);
}

function updateCameraFov(set){
  camera.fov = normalize(set,-1,1,40, 80);
  camera.updateProjectionMatrix();
}

function showReplay(){
  replayMessage.style.display="block";
}

function hideReplay(){
  replayMessage.style.display="none";
}

function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;

function init(event){

  // UI

  fieldDistance = document.getElementById("distValue");
  energyBar = document.getElementById("energyBar");
  replayMessage = document.getElementById("replayMessage");
  fieldLevel = document.getElementById("levelValue");
  levelCircle = document.getElementById("levelCircleStroke");

  resetGame();
  createScene();

  createLights();
  createNeko();
  createSea();
  createSky();
  createCoins();
  createEnnemies();
  createParticles();

  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);
  
  document.onkeydown = function(e)
	{
		switch (e.keyCode)
		{
			case 32:
				loop();
				playBG('audio/01.mp3');
				break;
		}
	}
}

function setupKeyControls()
{
	var nyancat = scene.getObjectByName('nyancat.mesh');
	document.onkeydown = function(e)
	{
		switch (e.keyCode)
		{
			case 32:
				disableScroll();
				shrinkNeko();
				tumbleNeko();
				checkLevel()
				break;
			case 39: //ROTATE TOWARDS SCREEN
				disableScroll();
				retumbleNeko();
				checkLevel()
				break;
			case 37: //ROTATE TOWARDS PERSON
				disableScroll();
				tumbleNeko();
				checkLevel()
				break;
			case 38: //FACE FRONT
				disableScroll();
				faceNeko();
				checkLevel()
				break;
			case 40: //FACE BACK
				disableScroll();
				backNeko();
				checkLevel()
				break;
			case 49: //CAMERA FOV
				disableScroll();
				updateCameraFov(-2);
				checkLevel()
				break;
			case 50: //CAMERA FOV
				disableScroll();
				updateCameraFov(0);
				checkLevel()
				break;
			case 51: //CAMERA FOV
				disableScroll();
				updateCameraFov(2);
				checkLevel()
				break;
			case 81: //FLIGHT SPEED
				disableScroll();
				updateFlightSpeed(-2);
				checkLevel()
				break;
			case 87: //FLIGHT SPEED
				disableScroll();
				updateFlightSpeed(0);
				checkLevel()
				break;
			case 69: //FLIGHT SPEED
				disableScroll();
				updateFlightSpeed(2);
				checkLevel()
				break;
			case 13: //START GAME
				disableScroll();
				updateFlightSpeed(-2);
	
				if (songIsPlaying == 1)
				{
					song.pause();
					song.currentTime = 0;
					songIsPlaying = 0;
					nyan_world('#e4e0ba', '#f7d9aa');
					nyan_fog(0xf7d9aa);
					checkLevel()
				}
				else
				{
					song_2.pause();
					song_2.currentTime = 0;
					nyan_world();
					playSong();
					songIsPlaying = 1;
					nyan_world('#557799','#003466');
					nyan_fog(0x003466);
				}
				
				break;
		}
	}
	document.onkeyup = function(e)
	{
		switch (e.keyCode)
		{
			case 32:
				disableScroll();
				enlargeNeko();
				break;
		}
	}
}

function nyan_world(colour_1, colour_2)
{
	document.getElementById("gameHolder").style.background = 'linear-gradient(' + colour_1 + ',' + colour_2 + ')';
	
	document.getElementById("gameHolder").style.background = '-webkit-linear-gradient(' + colour_1 + ',' + colour_2 + ')';
}

function nyan_fog(color)
{
	scene.fog = new THREE.Fog(color, 100,950);
}

var colour_2 = ['#e4e0ba', '#f7d9aa', '#fbf7bf', '#f9ae91', '#f59193', '#d47e97', '#bd86a6', '#877fa8'];
var colour_1 = ['#f7d9aa', '#fbf7bf', '#f9ae91', '#f59193', '#d47e97', '#bd86a6', '#877fa8', '#557799'];
var fog_colour = [0xf7d9aa, 0xfbf7bf, 0xf9ae91, 0xf59193, 0xd47e97, 0xbd86a6, 0x877fa8, 0x557799];
var time_of_day = 0;

function skyTime()
{
	document.getElementById("gameHolder").style.background = 'linear-gradient(' + colour_1[time_of_day] + ',' + colour_2[time_of_day] + ')';
	
	document.getElementById("gameHolder").style.background = '-webkit-linear-gradient(' + colour_1[time_of_day] + ',' + colour_2[time_of_day] + ')';
	
	nyan_fog(fog_colour[time_of_day]);
	
	time_of_day += 1;
	
	if(time_of_day == 8)
	{
		time_of_day = 0; //reset
	}
}

function playSong()
{
	song.setAttribute('src', 'audio/nyanlooped.mp3');
	song.setAttribute('loop', 'true');
	song.play();
}

function playBG(track)
{
	song_2.setAttribute('src', track);
	song_2.setAttribute('loop', 'true');
	song_2.play();
}

var levelFlag = 0
var levelFlag_up3 = 0

function checkLevel()
{
	if (game.level < 3 && levelFlag == 0)
	{
		levelFlag = 1;
		playBG('audio/02.mp3');
	}
	if (game.level >= 3 && levelFlag_up3 == 0)
	{
		levelFlag_up3 = 1;
		playBG('audio/06.mp3');
	}
	if ((game.level >= 3 && levelFlag_up3 == 1) || (game.level < 3 && levelFlag == 1))
	{
		//hello
	}
}

function shrinkNeko()
{
	nyancat.mesh.scale.set(.10, .10, .10);
}

function enlargeNeko()
{
	nyancat.mesh.scale.set(.25, .25, .25);
}

var tumble_count;

function tumbleNeko()
{
	nyancat.mesh.rotation.x += 0.3;
}

function retumbleNeko()
{
	nyancat.mesh.rotation.x -= 0.3;
}

function faceNeko()
{
	nyancat.mesh.rotation.y -= 0.3;
}

function backNeko()
{
	nyancat.mesh.rotation.y += 0.3;
}

function disableScroll() { 
    // Get the current page scroll position 
    scrollTop = window.pageYOffset || document.documentElement.scrollTop; 
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft, 
  
        // if any scroll is attempted, set this to the previous value 
        window.onscroll = function() { 
            window.scrollTo(scrollLeft, scrollTop); 
        }; 
}

window.addEventListener('load', init, false);