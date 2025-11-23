// Klokkia - Dutch Clock Learning Game
class ClockiaGame {
    constructor() {
        this.score = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentClock = null;
        this.attempts = 0;
        this.maxAttempts = 3;
        this.clocks = [];
        this.player = null;
        this.introComplete = true; // Skip intro animation
        this.characterType = null;
        this.gameWon = false;
        this.winScore = 100;
        this.usedPronunciation = false; // Track if player used pronunciation help
        
        // Mobile touch controls
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                        (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
        this.joystickActive = false;
        this.joystickDirection = { x: 0, z: 0 };
        
        // Three.js variables
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        // Player movement
        this.moveSpeed = 5;
        this.keys = {};
        
        // Camera controls
        this.mouseX = 0;
        this.mouseY = 0;
        this.cameraDistance = 20;
        this.cameraHeight = 10;
        this.cameraAngle = 0;
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Sound system
        this.sounds = {
            success: null,
            error: null,
            click: null,
            backgroundMusic: null
        };
        
        // Speech synthesis for Dutch pronunciation
        this.speechSynthesis = window.speechSynthesis;
        this.dutchVoice = null;
        this.initDutchVoice();
        
        // Music control
        this.musicPlaying = false;
        this.musicInterval = null;
        this.currentTrack = 0;
        this.tracks = ['melody1', 'melody2', 'melody3'];
        
        // Predator system
        this.predators = [];
        this.gameStartTime = null;
        this.predatorConfig = [
            { type: 'lion', icon: '🦁', spawnTime: 60, name: 'Leeuw' },       // 1 min
            { type: 'tiger', icon: '🐅', spawnTime: 120, name: 'Tijger' },     // 2 mins
            { type: 'wolf', icon: '🐺', spawnTime: 180, name: 'Wolf' },        // 3 mins
            { type: 'polar_bear', icon: '🐻‍❄️', spawnTime: 300, name: 'IJsbeer' }, // 5 mins
            { type: 'monster', icon: '👾', spawnTime: 600, name: 'Monster' }   // 10 mins
        ];
        this.activePredators = [];
        
        this.setupSounds();
        // Wait for character selection instead of immediate init
    }
    
    init() {
        this.setupThreeJS();
        this.createWorld();
        this.createClocks();
        this.createPlayer();
        this.setupEventListeners();
        this.animate();
        
        // Hide loading and character selection
        document.getElementById('loading').style.display = 'none';
        document.getElementById('character-selection').classList.add('hidden');
    }
    
    initDutchVoice() {
        // Wait for voices to load
        const setVoice = () => {
            const voices = this.speechSynthesis.getVoices();
            // Try to find a Dutch voice
            this.dutchVoice = voices.find(voice => voice.lang.startsWith('nl')) || 
                             voices.find(voice => voice.lang.startsWith('en')); // Fallback to English
        };
        
        if (this.speechSynthesis.getVoices().length > 0) {
            setVoice();
        } else {
            this.speechSynthesis.addEventListener('voiceschanged', setVoice);
        }
    }
    
    speakDutchTime(dutchTimeText) {
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(dutchTimeText);
        utterance.lang = 'nl-NL'; // Dutch language
        utterance.rate = 0.85; // Slightly slower for learning
        utterance.pitch = 1.1; // Slightly higher pitch for friendliness
        utterance.volume = 0.8;
        
        if (this.dutchVoice) {
            utterance.voice = this.dutchVoice;
        }
        
        this.speechSynthesis.speak(utterance);
    }
    
    setupSounds() {
        // Create simple sound effects using Web Audio API
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        
        // iOS requires user interaction to start audio context
        const resumeAudioContext = () => {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        };
        document.addEventListener('touchstart', resumeAudioContext, { once: true });
        document.addEventListener('click', resumeAudioContext, { once: true });
        
        // Success sound
        this.sounds.success = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };
        
        // Error sound
        this.sounds.error = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
        
        // Click sound
        this.sounds.click = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        };
        
        // Background music - multiple melodies
        this.sounds.backgroundMusic = () => {
            // Musical notes in Hz (C major scale)
            const notes = {
                C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
                G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25,
                E5: 659.25, G5: 783.99, B5: 987.77
            };
            
            // Three different melodies
            const melodies = {
                melody1: [ // Twinkle twinkle style
                    { note: notes.C4, duration: 0.25 },
                    { note: notes.C4, duration: 0.25 },
                    { note: notes.G4, duration: 0.25 },
                    { note: notes.G4, duration: 0.25 },
                    { note: notes.A4, duration: 0.25 },
                    { note: notes.A4, duration: 0.25 },
                    { note: notes.G4, duration: 0.5 },
                    { note: notes.F4, duration: 0.25 },
                    { note: notes.F4, duration: 0.25 },
                    { note: notes.E4, duration: 0.25 },
                    { note: notes.E4, duration: 0.25 },
                    { note: notes.D4, duration: 0.25 },
                    { note: notes.D4, duration: 0.25 },
                    { note: notes.C4, duration: 0.5 }
                ],
                melody2: [ // Happy birthday style rhythm
                    { note: notes.C4, duration: 0.3 },
                    { note: notes.C4, duration: 0.1 },
                    { note: notes.D4, duration: 0.4 },
                    { note: notes.C4, duration: 0.4 },
                    { note: notes.F4, duration: 0.4 },
                    { note: notes.E4, duration: 0.8 },
                    { note: notes.C4, duration: 0.3 },
                    { note: notes.C4, duration: 0.1 },
                    { note: notes.D4, duration: 0.4 },
                    { note: notes.C4, duration: 0.4 },
                    { note: notes.G4, duration: 0.4 },
                    { note: notes.F4, duration: 0.8 }
                ],
                melody3: [ // Mary had a little lamb
                    { note: notes.E4, duration: 0.25 },
                    { note: notes.D4, duration: 0.25 },
                    { note: notes.C4, duration: 0.25 },
                    { note: notes.D4, duration: 0.25 },
                    { note: notes.E4, duration: 0.25 },
                    { note: notes.E4, duration: 0.25 },
                    { note: notes.E4, duration: 0.5 },
                    { note: notes.D4, duration: 0.25 },
                    { note: notes.D4, duration: 0.25 },
                    { note: notes.D4, duration: 0.5 },
                    { note: notes.E4, duration: 0.25 },
                    { note: notes.G4, duration: 0.25 },
                    { note: notes.G4, duration: 0.5 },
                    { note: notes.E4, duration: 0.25 },
                    { note: notes.D4, duration: 0.25 },
                    { note: notes.C4, duration: 0.25 },
                    { note: notes.D4, duration: 0.25 },
                    { note: notes.E4, duration: 0.25 },
                    { note: notes.E4, duration: 0.25 },
                    { note: notes.E4, duration: 0.25 },
                    { note: notes.D4, duration: 0.25 },
                    { note: notes.D4, duration: 0.25 },
                    { note: notes.E4, duration: 0.25 },
                    { note: notes.D4, duration: 0.25 },
                    { note: notes.C4, duration: 0.5 }
                ]
            };
            
            // Get current melody
            const melody = melodies[this.tracks[this.currentTrack]];
            
            let currentTime = this.audioContext.currentTime;
            
            melody.forEach(({ note, duration }) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'triangle'; // Softer, more pleasant sound than sine
                oscillator.frequency.setValueAtTime(note, currentTime);
                
                // Soft volume for background music with envelope
                gainNode.gain.setValueAtTime(0, currentTime);
                gainNode.gain.linearRampToValueAtTime(0.04, currentTime + 0.02); // Quick attack
                gainNode.gain.linearRampToValueAtTime(0.03, currentTime + duration * 0.7); // Sustain
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration); // Release
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + duration);
                
                currentTime += duration;
            });
            
            return currentTime - this.audioContext.currentTime; // Return total duration
        };
    }
    
    startBackgroundMusic() {
        if (!this.musicPlaying && this.isPlaying) {
            // Resume audio context for iOS
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.musicPlaying = true;
            
            // Play the melody and loop it
            const playMelody = () => {
                if (this.musicPlaying && this.isPlaying && !this.isPaused) {
                    const duration = this.sounds.backgroundMusic();
                    // Schedule next play after melody finishes
                    this.musicInterval = setTimeout(() => {
                        // Switch to next track after each play
                        this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
                        playMelody();
                    }, duration * 1000 + 1000); // Add 1 second pause between tracks
                }
            };
            
            playMelody();
        }
    }
    
    stopBackgroundMusic() {
        this.musicPlaying = false;
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
    }
    
    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);
        
        // Hemisphere light for better colors
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x545454, 0.4);
        this.scene.add(hemiLight);
    }
    
    createWorld() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Sky
        const skyGeometry = new THREE.SphereGeometry(200, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Clouds
        this.createClouds();
        
        // Trees for decoration (reduced)
        for (let i = 0; i < 5; i++) {
            const tree = this.createTree();
            tree.position.set(
                Math.random() * 60 - 30,
                0,
                Math.random() * 60 - 30
            );
            this.scene.add(tree);
        }
        
        // Mushrooms for decoration
        for (let i = 0; i < 8; i++) {
            const mushroom = this.createMushroom();
            mushroom.position.set(
                Math.random() * 50 - 25,
                0,
                Math.random() * 50 - 25
            );
            mushroom.scale.set(
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4
            );
            this.scene.add(mushroom);
        }
        
        // Flowers for decoration
        for (let i = 0; i < 12; i++) {
            const flower = this.createFlower();
            flower.position.set(
                Math.random() * 55 - 27.5,
                0,
                Math.random() * 55 - 27.5
            );
            flower.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(flower);
        }
    }
    
    createTree() {
        const treeGroup = new THREE.Group();
        
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 3);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Leaves
        const leavesGeometry = new THREE.ConeGeometry(3, 5, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 5;
        leaves.castShadow = true;
        treeGroup.add(leaves);
        
        return treeGroup;
    }
    
    createMushroom() {
        const mushroomGroup = new THREE.Group();
        
        // Stem - white/cream colored
        const stemGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0xFFF8DC });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.6;
        mushroomGroup.add(stem);
        
        // Cap - red with white spots
        const capColors = [0xFF0000, 0xFF6347, 0xFFA500, 0x9370DB, 0xFF69B4]; // Various colors
        const capGeometry = new THREE.SphereGeometry(0.8, 8, 6);
        const capMaterial = new THREE.MeshLambertMaterial({ 
            color: capColors[Math.floor(Math.random() * capColors.length)]
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 1.3;
        cap.scale.y = 0.6; // Flatten the sphere to look more like a mushroom cap
        mushroomGroup.add(cap);
        
        // White spots on cap
        const spotGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const spotMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        for (let i = 0; i < 5; i++) {
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            const angle = (i / 5) * Math.PI * 2;
            const radius = 0.4 + Math.random() * 0.2;
            spot.position.set(
                Math.cos(angle) * radius,
                1.3 + Math.random() * 0.1,
                Math.sin(angle) * radius
            );
            mushroomGroup.add(spot);
        }
        
        return mushroomGroup;
    }
    
    createFlower() {
        const flowerGroup = new THREE.Group();
        
        // Stem - green
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.4;
        flowerGroup.add(stem);
        
        // Flower center
        const centerGeometry = new THREE.SphereGeometry(0.15, 6, 6);
        const centerColors = [0xFFFF00, 0xFFA500, 0xFF69B4]; // Yellow, orange, pink
        const centerMaterial = new THREE.MeshLambertMaterial({ 
            color: centerColors[Math.floor(Math.random() * centerColors.length)]
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.8;
        flowerGroup.add(center);
        
        // Petals
        const petalColors = [0xFF1493, 0xFFFFFF, 0xFF69B4, 0xFFA500, 0x9370DB, 0x87CEEB];
        const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)];
        const petalGeometry = new THREE.SphereGeometry(0.2, 4, 4);
        const petalMaterial = new THREE.MeshLambertMaterial({ color: petalColor });
        
        const numPetals = 5 + Math.floor(Math.random() * 3); // 5-7 petals
        for (let i = 0; i < numPetals; i++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            const angle = (i / numPetals) * Math.PI * 2;
            petal.position.set(
                Math.cos(angle) * 0.25,
                0.8,
                Math.sin(angle) * 0.25
            );
            petal.scale.set(1.2, 0.8, 0.4);
            petal.lookAt(new THREE.Vector3(
                Math.cos(angle) * 1,
                0.8,
                Math.sin(angle) * 1
            ));
            flowerGroup.add(petal);
        }
        
        // Leaves
        const leafGeometry = new THREE.SphereGeometry(0.2, 4, 4);
        const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        for (let i = 0; i < 2; i++) {
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            const side = i === 0 ? 1 : -1;
            leaf.position.set(side * 0.2, 0.3, 0);
            leaf.scale.set(1, 0.3, 0.5);
            leaf.rotation.z = side * Math.PI / 6;
            flowerGroup.add(leaf);
        }
        
        return flowerGroup;
    }
    
    createClouds() {
        // Create multiple clouds at different positions
        const cloudPositions = [
            { x: -20, y: 25, z: -30 },
            { x: 30, y: 30, z: -20 },
            { x: -10, y: 28, z: 25 },
            { x: 15, y: 32, z: 30 },
            { x: -35, y: 27, z: 10 },
            { x: 40, y: 29, z: -10 },
            { x: 0, y: 35, z: -35 },
            { x: -25, y: 26, z: -15 }
        ];
        
        cloudPositions.forEach((pos, index) => {
            const cloud = this.createCloud();
            cloud.position.set(pos.x, pos.y, pos.z);
            cloud.scale.set(
                1 + Math.random() * 0.5,
                1 + Math.random() * 0.3,
                1 + Math.random() * 0.5
            );
            // Store clouds for animation
            cloud.userData = {
                initialX: pos.x,
                speed: 0.5 + Math.random() * 0.5,
                range: 60,
                isCloud: true
            };
            this.scene.add(cloud);
        });
    }
    
    createCloud() {
        const cloudGroup = new THREE.Group();
        
        // Cloud material - white and fluffy looking
        const cloudMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFFFFF,
            opacity: 0.9,
            transparent: true
        });
        
        // Create cloud from multiple spheres for fluffy appearance
        const sphereGeometry = new THREE.SphereGeometry(1, 8, 6);
        
        // Center sphere
        const center = new THREE.Mesh(sphereGeometry, cloudMaterial);
        center.scale.set(2, 1.2, 1.5);
        cloudGroup.add(center);
        
        // Left spheres
        const left1 = new THREE.Mesh(sphereGeometry, cloudMaterial);
        left1.position.set(-1.5, 0.2, 0.3);
        left1.scale.set(1.5, 1, 1.2);
        cloudGroup.add(left1);
        
        const left2 = new THREE.Mesh(sphereGeometry, cloudMaterial);
        left2.position.set(-2.5, -0.2, 0);
        left2.scale.set(1.2, 0.8, 1);
        cloudGroup.add(left2);
        
        // Right spheres
        const right1 = new THREE.Mesh(sphereGeometry, cloudMaterial);
        right1.position.set(1.5, 0.1, 0.2);
        right1.scale.set(1.6, 1.1, 1.3);
        cloudGroup.add(right1);
        
        const right2 = new THREE.Mesh(sphereGeometry, cloudMaterial);
        right2.position.set(2.5, -0.1, 0);
        right2.scale.set(1.1, 0.9, 1);
        cloudGroup.add(right2);
        
        // Top sphere for extra fluffiness
        const top = new THREE.Mesh(sphereGeometry, cloudMaterial);
        top.position.set(0, 0.8, 0);
        top.scale.set(1.3, 0.8, 1);
        cloudGroup.add(top);
        
        // Bottom spheres
        const bottom1 = new THREE.Mesh(sphereGeometry, cloudMaterial);
        bottom1.position.set(-0.5, -0.6, 0.1);
        bottom1.scale.set(1.2, 0.6, 0.9);
        cloudGroup.add(bottom1);
        
        const bottom2 = new THREE.Mesh(sphereGeometry, cloudMaterial);
        bottom2.position.set(0.5, -0.6, 0);
        bottom2.scale.set(1.1, 0.6, 0.8);
        cloudGroup.add(bottom2);
        
        return cloudGroup;
    }
    
    createPredatorModel(type) {
        const group = new THREE.Group();
        
        switch(type) {
            case 'lion':
                // Lion body - golden brown
                const lionBodyGeometry = new THREE.BoxGeometry(3, 1.5, 1.5);
                const lionBodyMaterial = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
                const lionBody = new THREE.Mesh(lionBodyGeometry, lionBodyMaterial);
                lionBody.scale.set(1, 1, 0.9);
                group.add(lionBody);
                
                // Lion chest
                const chestGeometry = new THREE.BoxGeometry(1.5, 1.3, 1.3);
                const chestMaterial = new THREE.MeshLambertMaterial({ color: 0xF4A460 });
                const chest = new THREE.Mesh(chestGeometry, chestMaterial);
                chest.position.set(1, 0, 0);
                group.add(chest);
                
                // Lion head
                const lionHeadGeometry = new THREE.SphereGeometry(0.8, 8, 8);
                const lionHead = new THREE.Mesh(lionHeadGeometry, lionBodyMaterial);
                lionHead.position.set(2, 0.3, 0);
                lionHead.scale.set(1, 0.9, 0.9);
                group.add(lionHead);
                
                // Fluffy mane
                const maneGeometry = new THREE.SphereGeometry(1.2, 12, 12);
                const maneMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const mane = new THREE.Mesh(maneGeometry, maneMaterial);
                mane.position.set(2, 0.3, 0);
                mane.scale.set(1.4, 1.3, 1.3);
                group.add(mane);
                
                // Ears
                const earGeometry = new THREE.ConeGeometry(0.2, 0.3, 4);
                const leftEar = new THREE.Mesh(earGeometry, lionBodyMaterial);
                leftEar.position.set(2, 1, 0.4);
                group.add(leftEar);
                const rightEar = new THREE.Mesh(earGeometry, lionBodyMaterial);
                rightEar.position.set(2, 1, -0.4);
                group.add(rightEar);
                
                // Tail
                const tailGeometry = new THREE.CylinderGeometry(0.1, 0.15, 2, 6);
                const tail = new THREE.Mesh(tailGeometry, lionBodyMaterial);
                tail.position.set(-1.8, -0.5, 0);
                tail.rotation.z = Math.PI / 4;
                group.add(tail);
                
                // Tail tuft
                const tuftGeometry = new THREE.SphereGeometry(0.25, 6, 6);
                const tuft = new THREE.Mesh(tuftGeometry, maneMaterial);
                tuft.position.set(-2.8, -1.2, 0);
                group.add(tuft);
                break;
                
            case 'tiger':
                // Tiger body - orange with stripes
                const tigerBodyGeometry = new THREE.BoxGeometry(3.2, 1.6, 1.6);
                const tigerBodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
                const tigerBody = new THREE.Mesh(tigerBodyGeometry, tigerBodyMaterial);
                tigerBody.scale.set(1, 1, 0.9);
                group.add(tigerBody);
                
                // Tiger head
                const tigerHeadGeometry = new THREE.SphereGeometry(0.9, 8, 8);
                const tigerHead = new THREE.Mesh(tigerHeadGeometry, tigerBodyMaterial);
                tigerHead.position.set(2, 0.3, 0);
                tigerHead.scale.set(1, 0.9, 0.9);
                group.add(tigerHead);
                
                // White chest patch
                const tigerChestGeometry = new THREE.BoxGeometry(1.2, 1, 0.8);
                const tigerChestMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFAF0 });
                const tigerChest = new THREE.Mesh(tigerChestGeometry, tigerChestMaterial);
                tigerChest.position.set(1.2, -0.2, 0);
                group.add(tigerChest);
                
                // Stripes (black)
                const stripeGeometry = new THREE.BoxGeometry(0.2, 1.4, 1.7);
                const stripeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
                for(let i = 0; i < 4; i++) {
                    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
                    stripe.position.set(-1 + i * 0.7, 0, 0);
                    group.add(stripe);
                }
                
                // Ears
                const tigerEarGeometry = new THREE.ConeGeometry(0.25, 0.4, 4);
                const leftTigerEar = new THREE.Mesh(tigerEarGeometry, tigerBodyMaterial);
                leftTigerEar.position.set(2, 1.1, 0.5);
                group.add(leftTigerEar);
                const rightTigerEar = new THREE.Mesh(tigerEarGeometry, tigerBodyMaterial);
                rightTigerEar.position.set(2, 1.1, -0.5);
                group.add(rightTigerEar);
                
                // Long tail
                const tigerTailGeometry = new THREE.CylinderGeometry(0.12, 0.18, 2.5, 6);
                const tigerTail = new THREE.Mesh(tigerTailGeometry, tigerBodyMaterial);
                tigerTail.position.set(-2, -0.5, 0);
                tigerTail.rotation.z = Math.PI / 3;
                group.add(tigerTail);
                break;
                
            case 'wolf':
                // Wolf body - silver gray
                const wolfBodyGeometry = new THREE.BoxGeometry(2.8, 1.3, 1.3);
                const wolfBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
                const wolfBody = new THREE.Mesh(wolfBodyGeometry, wolfBodyMaterial);
                wolfBody.scale.set(1, 1, 0.85);
                group.add(wolfBody);
                
                // Wolf chest - lighter gray
                const wolfChestGeometry = new THREE.BoxGeometry(1.5, 1.2, 1.1);
                const wolfChestMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
                const wolfChest = new THREE.Mesh(wolfChestGeometry, wolfChestMaterial);
                wolfChest.position.set(0.8, -0.1, 0);
                group.add(wolfChest);
                
                // Wolf head - elongated snout
                const wolfHeadGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.8);
                const wolfHead = new THREE.Mesh(wolfHeadGeometry, wolfBodyMaterial);
                wolfHead.position.set(1.8, 0.3, 0);
                group.add(wolfHead);
                
                // Snout
                const snoutGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.5);
                const snout = new THREE.Mesh(snoutGeometry, wolfBodyMaterial);
                snout.position.set(2.5, 0.1, 0);
                group.add(snout);
                
                // Pointed ears
                const wolfEarGeometry = new THREE.ConeGeometry(0.2, 0.5, 3);
                const leftWolfEar = new THREE.Mesh(wolfEarGeometry, wolfBodyMaterial);
                leftWolfEar.position.set(1.7, 0.9, 0.3);
                group.add(leftWolfEar);
                const rightWolfEar = new THREE.Mesh(wolfEarGeometry, wolfBodyMaterial);
                rightWolfEar.position.set(1.7, 0.9, -0.3);
                group.add(rightWolfEar);
                
                // Fluffy tail
                const wolfTailGeometry = new THREE.ConeGeometry(0.3, 1.8, 8);
                const wolfTailMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
                const wolfTail = new THREE.Mesh(wolfTailGeometry, wolfTailMaterial);
                wolfTail.position.set(-1.8, -0.2, 0);
                wolfTail.rotation.z = Math.PI / 2.5;
                group.add(wolfTail);
                break;
                
            case 'polar_bear':
                // Polar bear body - fluffy white
                const bearBodyGeometry = new THREE.SphereGeometry(1.8, 8, 8);
                const bearBodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFF0 });
                const bearBody = new THREE.Mesh(bearBodyGeometry, bearBodyMaterial);
                bearBody.scale.set(1.8, 1, 1);
                group.add(bearBody);
                
                // Bear chest - rounder
                const bearChestGeometry = new THREE.SphereGeometry(1.2, 8, 8);
                const bearChest = new THREE.Mesh(bearChestGeometry, bearBodyMaterial);
                bearChest.position.set(1.5, 0, 0);
                bearChest.scale.set(1.2, 1, 1);
                group.add(bearChest);
                
                // Bear head - round and cute
                const bearHeadGeometry = new THREE.SphereGeometry(1, 8, 8);
                const bearHead = new THREE.Mesh(bearHeadGeometry, bearBodyMaterial);
                bearHead.position.set(2.5, 0.3, 0);
                bearHead.scale.set(1, 0.9, 0.9);
                group.add(bearHead);
                
                // Snout
                const bearSnoutGeometry = new THREE.SphereGeometry(0.4, 6, 6);
                const bearSnoutMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
                const bearSnout = new THREE.Mesh(bearSnoutGeometry, bearSnoutMaterial);
                bearSnout.position.set(3.2, 0.1, 0);
                bearSnout.scale.set(1.2, 0.8, 0.8);
                group.add(bearSnout);
                
                // Black nose
                const noseGeometry = new THREE.SphereGeometry(0.15, 4, 4);
                const noseMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
                const nose = new THREE.Mesh(noseGeometry, noseMaterial);
                nose.position.set(3.6, 0.1, 0);
                group.add(nose);
                
                // Round ears
                const bearEarGeometry = new THREE.SphereGeometry(0.35, 6, 6);
                const leftBearEar = new THREE.Mesh(bearEarGeometry, bearBodyMaterial);
                leftBearEar.position.set(2.3, 1.1, 0.6);
                group.add(leftBearEar);
                const rightBearEar = new THREE.Mesh(bearEarGeometry, bearBodyMaterial);
                rightBearEar.position.set(2.3, 1.1, -0.6);
                group.add(rightBearEar);
                
                // Small tail
                const bearTailGeometry = new THREE.SphereGeometry(0.3, 6, 6);
                const bearTail = new THREE.Mesh(bearTailGeometry, bearBodyMaterial);
                bearTail.position.set(-2.5, 0, 0);
                group.add(bearTail);
                break;
                
            case 'monster':
                // Cute monster body - bright purple/pink
                const monsterBodyGeometry = new THREE.SphereGeometry(1.5, 12, 12);
                const monsterBodyMaterial = new THREE.MeshLambertMaterial({ color: 0xDA70D6 });
                const monsterBody = new THREE.Mesh(monsterBodyGeometry, monsterBodyMaterial);
                monsterBody.scale.set(1.5, 1.3, 1.2);
                group.add(monsterBody);
                
                // Big friendly eyes - white with pupils
                const eyeWhiteGeometry = new THREE.SphereGeometry(0.4, 8, 8);
                const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
                const leftEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
                leftEyeWhite.position.set(1.2, 0.5, 0.5);
                group.add(leftEyeWhite);
                const rightEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
                rightEyeWhite.position.set(1.2, 0.5, -0.5);
                group.add(rightEyeWhite);
                
                // Pupils
                const pupilGeometry = new THREE.SphereGeometry(0.2, 6, 6);
                const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
                const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
                leftPupil.position.set(1.4, 0.5, 0.5);
                group.add(leftPupil);
                const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
                rightPupil.position.set(1.4, 0.5, -0.5);
                group.add(rightPupil);
                
                // Cute smile
                const smileGeometry = new THREE.TorusGeometry(0.5, 0.1, 4, 8, Math.PI);
                const smileMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });
                const smile = new THREE.Mesh(smileGeometry, smileMaterial);
                smile.position.set(1.2, -0.2, 0);
                smile.rotation.z = Math.PI;
                group.add(smile);
                
                // Antenna/horns
                const antennaGeometry = new THREE.ConeGeometry(0.15, 0.8, 6);
                const antennaMaterial = new THREE.MeshLambertMaterial({ color: 0xFF1493 });
                const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
                leftAntenna.position.set(0.5, 1.8, 0.4);
                group.add(leftAntenna);
                const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
                rightAntenna.position.set(0.5, 1.8, -0.4);
                group.add(rightAntenna);
                
                // Wavy tentacles - more colorful
                for(let i = 0; i < 6; i++) {
                    const tentacleGeometry = new THREE.CylinderGeometry(0.15, 0.25, 1.8, 8);
                    const tentacleColor = i % 2 === 0 ? 0xFF69B4 : 0xDA70D6;
                    const tentacleMat = new THREE.MeshLambertMaterial({ color: tentacleColor });
                    const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMat);
                    const angle = (i / 6) * Math.PI * 2;
                    tentacle.position.set(
                        Math.cos(angle) * 1.3,
                        -1.5,
                        Math.sin(angle) * 1.3
                    );
                    tentacle.rotation.z = angle * 0.2;
                    tentacle.rotation.x = Math.sin(angle) * 0.3;
                    group.add(tentacle);
                    
                    // Tentacle tips
                    const tipGeometry = new THREE.SphereGeometry(0.2, 6, 6);
                    const tip = new THREE.Mesh(tipGeometry, tentacleMat);
                    tip.position.set(
                        Math.cos(angle) * 1.3,
                        -2.3,
                        Math.sin(angle) * 1.3
                    );
                    group.add(tip);
                }
                break;
        }
        
        // Add legs for all predators
        if (type !== 'monster') {
            const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 6);
            const legMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            
            for(let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeometry, legMaterial);
                const x = i < 2 ? -0.8 : 0.8;
                const z = (i % 2 === 0) ? 0.5 : -0.5;
                leg.position.set(x, -1.2, z);
                group.add(leg);
            }
        }
        
        group.position.y = 2;
        return group;
    }
    
    spawnPredator(config) {
        console.log(`Spawning ${config.type}!`);
        
        // Show warning
        const warning = document.getElementById('predator-warning');
        const warningText = document.getElementById('warning-text');
        warningText.textContent = `Pas op! ${config.name} komt eraan!`;
        warning.style.display = 'block';
        
        setTimeout(() => {
            warning.style.display = 'none';
        }, 3000);
        
        // Create predator model
        const predator = this.createPredatorModel(config.type);
        
        // Position at edge of game
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0: predator.position.set(-50, 2, Math.random() * 40 - 20); break; // Left
            case 1: predator.position.set(50, 2, Math.random() * 40 - 20); break;  // Right
            case 2: predator.position.set(Math.random() * 40 - 20, 2, -50); break; // Back
            case 3: predator.position.set(Math.random() * 40 - 20, 2, 50); break;  // Front
        }
        
        predator.userData = {
            type: config.type,
            spawnTime: Date.now(),
            speed: 4 + Math.random() * 2,
            lifetime: 35000, // 35 seconds
            config: config
        };
        
        this.scene.add(predator);
        this.activePredators.push(predator);
        
        // Mark predator as active in legend
        const legendItem = document.querySelector(`.predator-item[data-type="${config.type}"]`);
        if (legendItem) {
            legendItem.style.background = 'rgba(255, 0, 0, 0.2)';
        }
    }
    
    updatePredators(delta) {
        const currentTime = Date.now();
        const gameTime = (currentTime - this.gameStartTime) / 1000; // in seconds
        
        // Check if we need to spawn new predators
        this.predatorConfig.forEach(config => {
            if (gameTime >= config.spawnTime && !config.spawned) {
                config.spawned = true;
                this.spawnPredator(config);
            }
        });
        
        // Update active predators
        for (let i = this.activePredators.length - 1; i >= 0; i--) {
            const predator = this.activePredators[i];
            const age = currentTime - predator.userData.spawnTime;
            
            // Remove if lifetime exceeded
            if (age > predator.userData.lifetime) {
                this.scene.remove(predator);
                this.activePredators.splice(i, 1);
                
                // Cross out in legend
                const legendItem = document.querySelector(`.predator-item[data-type="${predator.userData.type}"]`);
                if (legendItem) {
                    legendItem.classList.add('crossed');
                    legendItem.style.background = 'none';
                }
                continue;
            }
            
            // Move towards player
            if (this.player) {
                const direction = new THREE.Vector3();
                direction.subVectors(this.player.position, predator.position);
                direction.y = 0; // Keep on ground
                direction.normalize();
                
                const speed = predator.userData.speed * delta;
                predator.position.add(direction.multiplyScalar(speed));
                
                // Make predator face the player
                predator.lookAt(this.player.position);
                
                // Check collision with player
                const distance = predator.position.distanceTo(this.player.position);
                if (distance < 3) {
                    // Player caught - reset position
                    this.player.position.set(0, 2, 15);
                    
                    // Lose some points
                    this.score = Math.max(0, this.score - 5);
                    document.getElementById('score').textContent = this.score;
                    
                    // Play error sound
                    if (this.sounds.error) {
                        this.sounds.error();
                    }
                    
                    // Show warning
                    const warning = document.getElementById('predator-warning');
                    const warningText = document.getElementById('warning-text');
                    warningText.textContent = 'Gepakt! -5 punten!';
                    warning.style.display = 'block';
                    setTimeout(() => {
                        warning.style.display = 'none';
                    }, 2000);
                    
                    // Remove the predator after catching player
                    this.scene.remove(predator);
                    this.activePredators.splice(i, 1);
                    
                    // Cross out in legend
                    const legendItem = document.querySelector(`.predator-item[data-type="${predator.userData.type}"]`);
                    if (legendItem) {
                        legendItem.classList.add('crossed');
                        legendItem.style.background = 'none';
                    }
                    
                    // Don't continue checking this predator
                    continue;
                }
            }
        }
    }
    
    createClocks() {
        const clockPositions = [
            { x: -20, z: -20 },
            { x: 20, z: -20 },
            { x: -20, z: 20 },
            { x: 20, z: 20 },
            { x: 0, z: -25 },
            { x: 0, z: 25 },
            { x: -25, z: 0 },
            { x: 25, z: 0 }
        ];
        
        clockPositions.forEach((pos, index) => {
            const clockData = this.generateRandomTime();
            const clockMesh = this.createClockMesh(clockData.hours, clockData.minutes, index % 2 === 0);
            clockMesh.position.set(pos.x, 3, pos.z);
            
            // Make clocks face towards center for better visibility
            clockMesh.lookAt(0, 3, 0);
            
            clockMesh.userData = {
                time: clockData,
                dutchTime: clockData.dutchTime,
                id: index
            };
            this.clocks.push(clockMesh);
            this.scene.add(clockMesh);
        });
    }
    
    createClockMesh(hours, minutes, isClassic = true) {
        const clockGroup = new THREE.Group();
        
        // Clock base/pole - very short, just a stand
        const poleGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2.5);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = -0.75; // Position pole much lower
        pole.castShadow = true;
        clockGroup.add(pole);
        
        // Clock face background (simpler without rim)
        const faceGeometry = new THREE.CylinderGeometry(2.1, 2.1, 0.2, 32);
        const faceMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.y = 3;
        face.rotation.x = Math.PI / 2;
        face.castShadow = true;
        clockGroup.add(face);
        
        if (isClassic) {
            // Create a single flat canvas for the entire clock face
            const clockCanvas = document.createElement('canvas');
            clockCanvas.width = 512;
            clockCanvas.height = 512;
            const ctx = clockCanvas.getContext('2d');
            
            // Clear white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 512, 512);
            
            // Draw numbers clearly
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (let i = 1; i <= 12; i++) {
                const angle = (i * 30 - 90) * Math.PI / 180;
                const x = 256 + Math.cos(angle) * 190;
                const y = 256 + Math.sin(angle) * 190;
                ctx.fillText(i.toString(), x, y);
            }
            
            // Draw hour marks
            for (let i = 0; i < 12; i++) {
                const angle = i * 30 * Math.PI / 180;
                const x1 = 256 + Math.sin(angle) * 220;
                const y1 = 256 - Math.cos(angle) * 220;
                const x2 = 256 + Math.sin(angle) * 200;
                const y2 = 256 - Math.cos(angle) * 200;
                
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            
            // Draw center dot
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(256, 256, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw hour hand
            const hourAngle = ((hours % 12) + minutes / 60) * 30 - 90;
            const hourRad = hourAngle * Math.PI / 180;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(256, 256);
            ctx.lineTo(256 + Math.cos(hourRad) * 120, 256 + Math.sin(hourRad) * 120);
            ctx.stroke();
            
            // Draw minute hand
            const minuteAngle = minutes * 6 - 90;
            const minuteRad = minuteAngle * Math.PI / 180;
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(256, 256);
            ctx.lineTo(256 + Math.cos(minuteRad) * 170, 256 + Math.sin(minuteRad) * 170);
            ctx.stroke();
            
            // Create texture and apply to a simple plane
            const clockTexture = new THREE.CanvasTexture(clockCanvas);
            const clockFaceGeometry = new THREE.PlaneGeometry(4, 4);
            const clockFaceMaterial = new THREE.MeshBasicMaterial({ 
                map: clockTexture,
                side: THREE.DoubleSide
            });
            const clockFace = new THREE.Mesh(clockFaceGeometry, clockFaceMaterial);
            clockFace.position.y = 3;
            clockFace.position.z = 0.2;
            clockGroup.add(clockFace);
        } else {
            // Digital display
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 256, 128);
            ctx.fillStyle = '#0F0';
            ctx.font = 'bold 72px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            ctx.fillText(timeStr, 128, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            const displayGeometry = new THREE.PlaneGeometry(2.5, 1.25);
            const displayMaterial = new THREE.MeshBasicMaterial({ map: texture });
            const display = new THREE.Mesh(displayGeometry, displayMaterial);
            display.position.y = 3;
            display.position.z = 0.2;
            clockGroup.add(display);
        }
        
        return clockGroup;
    }
    
    generateRandomTime() {
        const hours = Math.floor(Math.random() * 24);
        const minutes = Math.floor(Math.random() * 12) * 5; // 5-minute intervals
        const dutchTime = this.convertToDutchTime(hours, minutes);
        
        return { hours, minutes, dutchTime };
    }
    
    convertToDutchTime(hours, minutes) {
        const hourNames = [
            'twaalf', 'een', 'twee', 'drie', 'vier', 'vijf',
            'zes', 'zeven', 'acht', 'negen', 'tien', 'elf'
        ];
        
        let hour = hours % 12;
        let nextHour = (hour + 1) % 12;
        
        // Handle special cases
        if (minutes === 0) {
            if (hours === 0 || hours === 24) return 'middernacht';
            if (hours === 12) return 'middag';
            return hourNames[hour] + ' uur';
        }
        
        if (minutes === 15) {
            return 'kwart over ' + hourNames[hour];
        }
        
        if (minutes === 30) {
            return 'half ' + hourNames[nextHour];
        }
        
        if (minutes === 45) {
            return 'kwart voor ' + hourNames[nextHour];
        }
        
        if (minutes < 30) {
            if (minutes === 5) return 'vijf over ' + hourNames[hour];
            if (minutes === 10) return 'tien over ' + hourNames[hour];
            if (minutes === 20) return 'tien voor half ' + hourNames[nextHour];
            if (minutes === 25) return 'vijf voor half ' + hourNames[nextHour];
        } else {
            if (minutes === 35) return 'vijf over half ' + hourNames[nextHour];
            if (minutes === 40) return 'tien over half ' + hourNames[nextHour];
            if (minutes === 50) return 'tien voor ' + hourNames[nextHour];
            if (minutes === 55) return 'vijf voor ' + hourNames[nextHour];
        }
        
        return hourNames[hour] + ' uur ' + minutes;
    }
    
    createPlayer() {
        const playerGroup = new THREE.Group();
        
        if (this.characterType === 'girl') {
            // Girl character
            // Body - dress shape
            const dressGeometry = new THREE.ConeGeometry(0.6, 1.8, 8);
            const dressMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 }); // Pink
            const dress = new THREE.Mesh(dressGeometry, dressMaterial);
            dress.position.y = 0.2;
            dress.castShadow = true;
            playerGroup.add(dress);
            
            // Head
            const headGeometry = new THREE.SphereGeometry(0.45, 8, 8);
            const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBD7 }); // Skin tone
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 1.5;
            head.castShadow = true;
            playerGroup.add(head);
            
            // Hair - pigtails
            const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
            const leftPigtailGeometry = new THREE.SphereGeometry(0.25, 6, 6);
            const leftPigtail = new THREE.Mesh(leftPigtailGeometry, hairMaterial);
            leftPigtail.position.set(-0.5, 1.6, 0);
            playerGroup.add(leftPigtail);
            
            const rightPigtail = new THREE.Mesh(leftPigtailGeometry, hairMaterial);
            rightPigtail.position.set(0.5, 1.6, 0);
            playerGroup.add(rightPigtail);
            
            // Hair top
            const hairTopGeometry = new THREE.SphereGeometry(0.48, 8, 8);
            const hairTop = new THREE.Mesh(hairTopGeometry, hairMaterial);
            hairTop.position.set(0, 1.7, -0.1);
            hairTop.scale.set(1, 0.7, 1);
            playerGroup.add(hairTop);
            
        } else {
            // Boy character
            // Body - shirt and shorts
            const shirtGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8);
            const shirtMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 }); // Blue
            const shirt = new THREE.Mesh(shirtGeometry, shirtMaterial);
            shirt.position.y = 0.3;
            shirt.castShadow = true;
            playerGroup.add(shirt);
            
            // Shorts
            const shortsGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.6, 8);
            const shortsMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F2F }); // Dark green
            const shorts = new THREE.Mesh(shortsGeometry, shortsMaterial);
            shorts.position.y = -0.6;
            shorts.castShadow = true;
            playerGroup.add(shorts);
            
            // Head
            const headGeometry = new THREE.SphereGeometry(0.45, 8, 8);
            const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBD7 }); // Skin tone
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 1.5;
            head.castShadow = true;
            playerGroup.add(head);
            
            // Hair - spiky
            const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x2F1B0C }); // Dark brown
            const hairGeometry = new THREE.ConeGeometry(0.48, 0.3, 8);
            const hair = new THREE.Mesh(hairGeometry, hairMaterial);
            hair.position.set(0, 1.8, 0);
            playerGroup.add(hair);
        }
        
        // Common features for both
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.08);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const eyeWhiteGeometry = new THREE.SphereGeometry(0.12);
        const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        // Left eye
        const leftEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
        leftEyeWhite.position.set(-0.15, 1.5, 0.38);
        playerGroup.add(leftEyeWhite);
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.5, 0.42);
        playerGroup.add(leftEye);
        
        // Right eye
        const rightEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
        rightEyeWhite.position.set(0.15, 1.5, 0.38);
        playerGroup.add(rightEyeWhite);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.5, 0.42);
        playerGroup.add(rightEye);
        
        // Smile
        const smileGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 8, Math.PI);
        const smileMaterial = new THREE.MeshBasicMaterial({ color: 0xFF1493 });
        const smile = new THREE.Mesh(smileGeometry, smileMaterial);
        smile.position.set(0, 1.35, 0.4);
        smile.rotation.z = Math.PI;
        playerGroup.add(smile);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBD7 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.6, 0.2, 0);
        leftArm.rotation.z = Math.PI / 6;
        playerGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.6, 0.2, 0);
        rightArm.rotation.z = -Math.PI / 6;
        playerGroup.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.18, 0.15, 1, 6);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBD7 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.25, -1.2, 0);
        playerGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.25, -1.2, 0);
        playerGroup.add(rightLeg);
        
        // Shoes
        const shoeGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.35);
        const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        leftShoe.position.set(-0.25, -1.75, 0.05);
        playerGroup.add(leftShoe);
        
        const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        rightShoe.position.set(0.25, -1.75, 0.05);
        playerGroup.add(rightShoe);
        
        this.player = playerGroup;
        this.player.position.set(0, 2, 15);
        this.scene.add(this.player);
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Prevent default for arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Game controls
        document.getElementById('playBtn').addEventListener('click', () => {
            this.sounds.click();
            this.startGame();
        });
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.sounds.click();
            this.pauseGame();
        });
        
        // Music toggle button
        const musicBtn = document.getElementById('musicBtn');
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                this.sounds.click();
                if (this.musicPlaying) {
                    this.stopBackgroundMusic();
                    musicBtn.textContent = '🔇 Muziek';
                } else {
                    this.startBackgroundMusic();
                    musicBtn.textContent = '🎵 Muziek';
                }
            });
        }
        document.getElementById('submitBtn').addEventListener('click', () => {
            this.sounds.click();
            this.checkAnswer();
        });
        
        // Pronunciation button
        document.getElementById('pronounceBtn').addEventListener('click', () => {
            this.sounds.click();
            if (this.currentClock && this.currentClock.userData.dutchTime) {
                this.speakDutchTime(this.currentClock.userData.dutchTime);
                this.usedPronunciation = true; // Mark that player used help
            }
        });
        document.getElementById('timeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sounds.click();
                this.checkAnswer();
            }
        });
        
        // Intro overlay
        document.getElementById('intro-overlay').addEventListener('click', () => this.startIntroAnimation());
        
        // Mouse controls for camera rotation
        document.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isMouseDown && this.isPlaying && !this.isPaused) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                // Rotate camera around player
                this.cameraAngle -= deltaX * 0.005;
                
                // Adjust camera height
                this.cameraHeight = Math.max(5, Math.min(25, this.cameraHeight - deltaY * 0.05));
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        // Touch controls for mobile/trackpad
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                this.isMouseDown = true;
            }
        });
        
        document.addEventListener('touchend', () => {
            this.isMouseDown = false;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.isMouseDown && this.isPlaying && !this.isPaused) {
                const deltaX = e.touches[0].clientX - touchStartX;
                const deltaY = e.touches[0].clientY - touchStartY;
                
                this.cameraAngle -= deltaX * 0.005;
                this.cameraHeight = Math.max(5, Math.min(25, this.cameraHeight - deltaY * 0.05));
                
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                
                e.preventDefault();
            }
        });
        
        // Mouse wheel for zoom
        document.addEventListener('wheel', (e) => {
            if (this.isPlaying && !this.isPaused) {
                e.preventDefault();
                this.cameraDistance = Math.max(10, Math.min(40, this.cameraDistance + e.deltaY * 0.01));
            }
        }, { passive: false });
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mobile touch controls
        this.setupMobileControls();
    }
    
    setupMobileControls() {
        // Show mobile controls if on mobile or for testing
        if (this.isMobile) {
            const mobileControls = document.querySelector('.mobile-controls');
            if (mobileControls) {
                mobileControls.style.display = 'flex';
            }
        }
        
        const joystick = document.getElementById('joystick');
        const joystickKnob = document.getElementById('joystick-knob');
        
        if (!joystick || !joystickKnob) return;
        
        // Joystick touch controls
        const handleJoystickStart = (e) => {
            e.preventDefault();
            this.joystickActive = true;
        };
        
        const handleJoystickMove = (e) => {
            if (!this.joystickActive) return;
            e.preventDefault();
            
            // Handle both touch and mouse events
            const touch = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            let deltaX = touch.clientX - centerX;
            let deltaY = touch.clientY - centerY;
            
            // Limit to circle
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = rect.width / 2 - 20;
            
            if (distance > maxDistance) {
                deltaX = (deltaX / distance) * maxDistance;
                deltaY = (deltaY / distance) * maxDistance;
            }
            
            // Update knob position
            joystickKnob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
            
            // Update movement direction (normalized)
            this.joystickDirection.x = deltaX / maxDistance;
            this.joystickDirection.z = deltaY / maxDistance;
        };
        
        const handleJoystickEnd = (e) => {
            e.preventDefault();
            this.joystickActive = false;
            this.joystickDirection = { x: 0, z: 0 };
            joystickKnob.style.transform = 'translate(-50%, -50%)';
        };
        
        // Add touch event listeners to the entire joystick area
        joystick.addEventListener('touchstart', handleJoystickStart, { passive: false });
        joystick.addEventListener('touchmove', handleJoystickMove, { passive: false });
        joystick.addEventListener('touchend', handleJoystickEnd, { passive: false });
        joystick.addEventListener('touchcancel', handleJoystickEnd, { passive: false });
        
        // Also handle mouse events for testing
        joystick.addEventListener('mousedown', (e) => {
            handleJoystickStart(e);
            const handleMouseMove = (e) => handleJoystickMove(e);
            const handleMouseUp = (e) => {
                handleJoystickEnd(e);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        // Camera controls
        const cameraLeft = document.getElementById('camera-left');
        const cameraRight = document.getElementById('camera-right');
        const cameraZoomIn = document.getElementById('camera-zoom-in');
        const cameraZoomOut = document.getElementById('camera-zoom-out');
        
        if (cameraLeft) {
            cameraLeft.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.cameraAngle -= 0.1;
            }, { passive: false });
        }
        
        if (cameraRight) {
            cameraRight.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.cameraAngle += 0.1;
            }, { passive: false });
        }
        
        if (cameraZoomIn) {
            cameraZoomIn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.cameraDistance = Math.max(10, this.cameraDistance - 2);
            }, { passive: false });
        }
        
        if (cameraZoomOut) {
            cameraZoomOut.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.cameraDistance = Math.min(40, this.cameraDistance + 2);
            }, { passive: false });
        }
    }
    
    startIntroAnimation() {
        const overlay = document.getElementById('intro-overlay');
        overlay.innerHTML = '<div style="font-size: 24px;">📚 Een dag heeft 24 uren! 📚</div>';
        
        // Create sun for daytime (6:00 - 18:00)
        const sunGeometry = new THREE.SphereGeometry(3);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFD700,
            emissive: 0xFFD700
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        
        // Add sun rays
        const rayGeometry = new THREE.ConeGeometry(0.5, 4, 4);
        const rayMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        for(let i = 0; i < 8; i++) {
            const ray = new THREE.Mesh(rayGeometry, rayMaterial);
            const angle = (i / 8) * Math.PI * 2;
            ray.position.set(Math.cos(angle) * 4, Math.sin(angle) * 4, 0);
            ray.rotation.z = angle;
            sun.add(ray);
        }
        this.scene.add(sun);
        
        // Create moon for nighttime
        const moonGeometry = new THREE.SphereGeometry(2.5);
        const moonMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xF8F8FF,
            emissive: 0xE0E0E0
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        
        // Add moon craters
        for(let i = 0; i < 5; i++) {
            const craterGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.3);
            const craterMaterial = new THREE.MeshBasicMaterial({ color: 0xD0D0D0 });
            const crater = new THREE.Mesh(craterGeometry, craterMaterial);
            crater.position.set(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                1
            );
            moon.add(crater);
        }
        
        // Add stars for night
        const stars = [];
        for(let i = 0; i < 50; i++) {
            const starGeometry = new THREE.SphereGeometry(0.1);
            const starMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFFFFFF,
                emissive: 0xFFFFFF
            });
            const star = new THREE.Mesh(starGeometry, starMaterial);
            star.position.set(
                (Math.random() - 0.5) * 100,
                Math.random() * 40,
                -50
            );
            stars.push(star);
            this.scene.add(star);
        }
        
        this.scene.add(moon);
        
        // Position camera for better 3D view
        this.camera.position.set(0, 15, 40);
        this.camera.lookAt(0, 10, 0);
        
        // Animate full 24-hour cycle
        const animationDuration = 12000; // 12 seconds for full day
        const startTime = Date.now();
        
        const animateCycle = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / animationDuration;
            
            if (progress >= 1) {
                // Animation complete
                overlay.classList.add('hidden');
                this.scene.remove(sun);
                this.scene.remove(moon);
                stars.forEach(star => this.scene.remove(star));
                this.introComplete = true;
                
                // Reset camera and scene
                this.camera.position.set(0, 20, 30);
                this.camera.lookAt(0, 0, 0);
                this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
                return;
            }
            
            // Calculate current hour (0-24)
            const hour = progress * 24;
            
            // Three phases: Night1 (0-6), Day (6-18), Night2 (18-24)
            let skyColor;
            let showSun = false;
            let showMoon = false;
            let showStars = false;
            
            if (hour < 6) {
                // Early morning (0:00 - 6:00) - Moon going down
                showMoon = true;
                showStars = true;
                const moonProgress = hour / 6;
                const angle = moonProgress * Math.PI / 2 + Math.PI;
                moon.position.x = Math.cos(angle) * 35;
                moon.position.y = Math.sin(angle) * 25;
                moon.position.z = -10;
                skyColor = new THREE.Color(0x0a0a1e);
            } else if (hour < 18) {
                // Daytime (6:00 - 18:00) - Sun arc
                showSun = true;
                const sunProgress = (hour - 6) / 12;
                const angle = sunProgress * Math.PI;
                sun.position.x = -Math.cos(angle) * 35;
                sun.position.y = Math.sin(angle) * 25 + 5;
                sun.position.z = -10;
                
                // Sky color changes during day
                if (hour < 8) {
                    // Sunrise
                    skyColor = new THREE.Color().lerpColors(
                        new THREE.Color(0x0a0a1e),
                        new THREE.Color(0xFFB366),
                        (hour - 6) / 2
                    );
                } else if (hour < 16) {
                    // Midday
                    skyColor = new THREE.Color(0x87CEEB);
                } else {
                    // Sunset
                    skyColor = new THREE.Color().lerpColors(
                        new THREE.Color(0x87CEEB),
                        new THREE.Color(0xFF6B35),
                        (hour - 16) / 2
                    );
                }
            } else {
                // Evening/Night (18:00 - 24:00) - Moon rising again
                showMoon = true;
                showStars = true;
                const moonProgress = (hour - 18) / 6;
                const angle = moonProgress * Math.PI / 2;
                moon.position.x = -Math.cos(angle) * 35;
                moon.position.y = Math.sin(angle) * 25;
                moon.position.z = -10;
                skyColor = new THREE.Color(0x0a0a1e);
            }
            
            // Update visibility
            sun.visible = showSun;
            moon.visible = showMoon;
            stars.forEach(star => star.visible = showStars);
            
            // Rotate sun and moon for 3D effect
            if(showSun) sun.rotation.y += 0.02;
            if(showMoon) moon.rotation.y += 0.01;
            
            // Update fog/sky color
            this.scene.fog.color = skyColor;
            
            // Update overlay text with educational info
            const displayHour = Math.floor(hour) % 24;
            let timeOfDay = '';
            if (displayHour >= 0 && displayHour < 6) {
                timeOfDay = '🌙 Nacht';
            } else if (displayHour >= 6 && displayHour < 12) {
                timeOfDay = '🌅 Ochtend';
            } else if (displayHour >= 12 && displayHour < 18) {
                timeOfDay = '☀️ Middag';
            } else {
                timeOfDay = '🌃 Avond';
            }
            
            overlay.innerHTML = `
                <div style="font-size: 20px; margin-bottom: 10px;">📚 Een dag heeft 24 uren! 📚</div>
                <div style="font-size: 32px; font-weight: bold;">🕐 ${displayHour.toString().padStart(2, '0')}:00 uur</div>
                <div style="font-size: 24px; margin-top: 10px;">${timeOfDay}</div>
                <div style="font-size: 16px; margin-top: 10px;">Kijk hoe de zon en maan bewegen!</div>
            `;
            
            requestAnimationFrame(animateCycle);
        };
        
        animateCycle();
    }
    
    startGame() {
        // Intro animation removed - skip directly to game
        
        this.isPlaying = true;
        this.isPaused = false;
        this.gameStartTime = Date.now();
        document.getElementById('playBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'block';
        document.getElementById('musicBtn').style.display = 'block';
        
        // Show predator legend
        document.getElementById('predator-legend').classList.add('active');
        
        // Reset predator spawned flags
        this.predatorConfig.forEach(config => {
            config.spawned = false;
        });
        
        // Start background music
        this.startBackgroundMusic();
    }
    
    pauseGame() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '▶️ Hervat' : '⏸️ Pauze';
        
        // Handle music
        if (this.isPaused) {
            this.stopBackgroundMusic();
        } else {
            this.startBackgroundMusic();
        }
    }
    
    updatePlayerMovement(delta) {
        if (!this.isPlaying || this.isPaused || !this.player) return;
        
        const speed = this.moveSpeed * delta;
        
        // Calculate movement direction based on camera angle
        const forward = new THREE.Vector3(
            -Math.sin(this.cameraAngle),
            0,
            -Math.cos(this.cameraAngle)
        );
        const right = new THREE.Vector3(
            -Math.cos(this.cameraAngle),
            0,
            Math.sin(this.cameraAngle)
        );
        
        // WASD and Arrow keys movement relative to camera
        let moveX = 0;
        let moveZ = 0;
        
        // Keyboard input
        if (this.keys['w'] || this.keys['arrowup']) {
            moveZ -= 1;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            moveZ += 1;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            moveX -= 1;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            moveX += 1;
        }
        
        // Joystick input (mobile)
        if (this.joystickActive) {
            moveX += this.joystickDirection.x;
            moveZ += this.joystickDirection.z;
        }
        
        // Apply movement
        if (moveZ !== 0) {
            this.player.position.add(forward.clone().multiplyScalar(-moveZ * speed));
        }
        if (moveX !== 0) {
            this.player.position.add(right.clone().multiplyScalar(-moveX * speed));
        }
        
        // Keep player within bounds
        this.player.position.x = Math.max(-45, Math.min(45, this.player.position.x));
        this.player.position.z = Math.max(-45, Math.min(45, this.player.position.z));
        
        // Camera follow player with rotation
        const cameraX = this.player.position.x + Math.sin(this.cameraAngle) * this.cameraDistance;
        const cameraZ = this.player.position.z + Math.cos(this.cameraAngle) * this.cameraDistance;
        
        this.camera.position.set(cameraX, this.cameraHeight, cameraZ);
        this.camera.lookAt(this.player.position);
        
        // Check proximity to clocks
        this.checkClockProximity();
    }
    
    checkClockProximity() {
        const inputContainer = document.getElementById('inputContainer');
        let nearClock = false;
        
        for (const clock of this.clocks) {
            const distance = this.player.position.distanceTo(clock.position);
            
            if (distance < 5) {
                nearClock = true;
                if (this.currentClock !== clock) {
                    this.currentClock = clock;
                    this.attempts = 0;
                    this.usedPronunciation = false; // Reset pronunciation flag for new clock
                    this.showClockChallenge();
                    
                    // Show pronunciation button
                    const pronounceBtn = document.getElementById('pronounceBtn');
                    if (pronounceBtn) {
                        pronounceBtn.style.display = 'inline-block';
                    }
                }
                break;
            }
        }
        
        if (!nearClock && this.currentClock) {
            this.currentClock = null;
            inputContainer.classList.remove('active');
            document.getElementById('feedback').style.display = 'none';
            
            // Hide pronunciation button
            const pronounceBtn = document.getElementById('pronounceBtn');
            if (pronounceBtn) {
                pronounceBtn.style.display = 'none';
            }
        }
    }
    
    showClockChallenge() {
        const inputContainer = document.getElementById('inputContainer');
        inputContainer.classList.add('active');
        
        const timeInput = document.getElementById('timeInput');
        timeInput.value = '';
        timeInput.focus();
        
        const feedback = document.getElementById('feedback');
        feedback.style.display = 'none';
        feedback.className = 'feedback';
    }
    
    checkAnswer() {
        if (!this.currentClock) return;
        
        const userAnswer = document.getElementById('timeInput').value.toLowerCase().trim();
        const correctAnswer = this.currentClock.userData.dutchTime.toLowerCase();
        const feedback = document.getElementById('feedback');
        
        this.attempts++;
        
        // Normalize answers for comparison
        const normalizedUser = userAnswer.replace(/\s+/g, ' ');
        const normalizedCorrect = correctAnswer.replace(/\s+/g, ' ');
        
        if (normalizedUser === normalizedCorrect || this.isAnswerCorrect(normalizedUser, normalizedCorrect)) {
            // Correct answer
            feedback.className = 'feedback correct';
            feedback.textContent = '✅ Heel goed! Uitstekend!';
            feedback.style.display = 'block';
            this.sounds.success();
            
            // Award points based on whether pronunciation was used
            const points = this.usedPronunciation ? 1 : 10;
            this.score += points;
            document.getElementById('score').textContent = this.score;
            
            // Show points earned in feedback
            if (this.usedPronunciation) {
                feedback.textContent = '✅ Goed! (+1 punt - je gebruikte hulp)';
            }
            
            // Check for win condition
            if (this.score >= this.winScore && !this.gameWon) {
                this.gameWon = true;
                this.showWinMessage();
                return;
            }
            
            // Remove answered clock and create a new one
            setTimeout(() => {
                const index = this.clocks.indexOf(this.currentClock);
                this.scene.remove(this.currentClock);
                
                // Create new clock at same position
                const newClockData = this.generateRandomTime();
                const newClock = this.createClockMesh(
                    newClockData.hours, 
                    newClockData.minutes, 
                    Math.random() > 0.5
                );
                newClock.position.copy(this.currentClock.position);
                
                // Make new clock face towards center
                newClock.lookAt(0, 3, 0);
                
                newClock.userData = {
                    time: newClockData,
                    dutchTime: newClockData.dutchTime,
                    id: this.currentClock.userData.id
                };
                this.clocks[index] = newClock;
                this.scene.add(newClock);
                
                this.currentClock = null;
                document.getElementById('inputContainer').classList.remove('active');
                
                // Hide pronunciation button
                const pronounceBtn = document.getElementById('pronounceBtn');
                if (pronounceBtn) {
                    pronounceBtn.style.display = 'none';
                }
            }, 2000);
        } else {
            // Incorrect answer
            if (this.attempts >= this.maxAttempts) {
                feedback.className = 'feedback hint';
                feedback.textContent = `💡 Het goede antwoord is: ${correctAnswer}`;
                feedback.style.display = 'block';
                this.sounds.error();
                
                // Speak the correct answer
                this.speakDutchTime(this.currentClock.userData.dutchTime);
                
                setTimeout(() => {
                    this.currentClock = null;
                    document.getElementById('inputContainer').classList.remove('active');
                    
                    // Hide pronunciation button
                    const pronounceBtn = document.getElementById('pronounceBtn');
                    if (pronounceBtn) {
                        pronounceBtn.style.display = 'none';
                    }
                }, 3000);
            } else {
                feedback.className = 'feedback incorrect';
                feedback.textContent = `❌ Probeer het nog eens! (Nog ${this.maxAttempts - this.attempts} keer)`;
                feedback.style.display = 'block';
                this.sounds.error();
                document.getElementById('timeInput').value = '';
                document.getElementById('timeInput').focus();
            }
        }
    }
    
    isAnswerCorrect(userAnswer, correctAnswer) {
        // Additional flexibility for Dutch time answers
        const variations = [
            // Allow variations in spacing and spelling
            correctAnswer.replace('half', 'half'),
            correctAnswer.replace('kwart', 'kwart'),
            // Allow numeric hours
            correctAnswer.replace(/een/g, '1').replace(/twee/g, '2').replace(/drie/g, '3')
                       .replace(/vier/g, '4').replace(/vijf/g, '5').replace(/zes/g, '6')
                       .replace(/zeven/g, '7').replace(/acht/g, '8').replace(/negen/g, '9')
                       .replace(/tien/g, '10').replace(/elf/g, '11').replace(/twaalf/g, '12')
        ];
        
        return variations.some(variation => variation === userAnswer);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Update player movement
        this.updatePlayerMovement(delta);
        
        // Update predator system
        if (this.isPlaying && !this.isPaused) {
            this.updatePredators(delta);
        }
        
        // Animate clouds - slow drift
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.isCloud) {
                // Move cloud slowly
                child.position.x += child.userData.speed * 0.01;
                
                // Wrap around when cloud goes too far
                if (child.position.x > child.userData.initialX + child.userData.range / 2) {
                    child.position.x = child.userData.initialX - child.userData.range / 2;
                }
                
                // Gentle floating motion
                child.position.y += Math.sin(Date.now() * 0.0001 * child.userData.speed) * 0.01;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    showWinMessage() {
        // Stop the game
        this.isPlaying = false;
        this.isPaused = true;
        
        // Stop music
        this.stopBackgroundMusic();
        
        // Create win overlay
        const winOverlay = document.createElement('div');
        winOverlay.id = 'win-overlay';
        winOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            font-family: 'Comic Sans MS', cursive, sans-serif;
            animation: fadeIn 0.5s;
        `;
        
        winOverlay.innerHTML = `
            <div style="text-align: center; animation: bounce 1s infinite;">
                <h1 style="font-size: 72px; margin: 20px;">🎉 GEWONNEN! 🎉</h1>
                <h2 style="font-size: 48px; margin: 20px;">Je hebt ${this.score} punten!</h2>
                <p style="font-size: 32px; margin: 20px;">🌟 Je bent een klok-kampioen! 🌟</p>
                <p style="font-size: 24px; margin: 20px;">Je kunt perfect de tijd lezen!</p>
                <div style="margin-top: 30px;">
                    <span style="font-size: 100px;">🏆</span>
                </div>
                <button onclick="location.reload()" style="
                    margin-top: 30px;
                    padding: 15px 40px;
                    font-size: 24px;
                    background: white;
                    color: #764ba2;
                    border: none;
                    border-radius: 50px;
                    cursor: pointer;
                    font-weight: bold;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                ">Opnieuw Spelen</button>
            </div>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
            </style>
        `;
        
        document.body.appendChild(winOverlay);
        
        // Play success sound multiple times
        for(let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (this.sounds.success) this.sounds.success();
            }, i * 500);
        }
    }
}

// Character selection and game initialization
let gameInstance = null;

function selectCharacter(type) {
    if (!gameInstance) {
        gameInstance = new ClockiaGame();
    }
    gameInstance.characterType = type;
    gameInstance.init();
    
    // Play click sound
    if (gameInstance.sounds.click) {
        gameInstance.sounds.click();
    }
}

// Make selectCharacter globally available
window.selectCharacter = selectCharacter;

// Initialize on DOM load (but wait for character selection)
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading once ready
    document.getElementById('loading').style.display = 'none';
});
