// Sistema de colisiones con controles personalizados
        AFRAME.registerComponent('movement-controls', {
            schema: {
                speed: { type: 'number', default: 0.15 },
                constrainToNavMesh: { type: 'boolean', default: false }
            },

            init: function () {
                this.velocity = new THREE.Vector3();
                this.keys = {};
                this.collidables = [];
                this.raycaster = new THREE.Raycaster();
                this.checkDistance = 0.6;

                // Capturar teclas
                window.addEventListener('keydown', (e) => {
                    this.keys[e.key.toLowerCase()] = true;
                });

                window.addEventListener('keyup', (e) => {
                    this.keys[e.key.toLowerCase()] = false;
                });

                // Esperar a que carguen los objetos
                setTimeout(() => {
                    const els = document.querySelectorAll('.collidable');
                    els.forEach(el => {
                        if (el.object3D) {
                            this.collidables.push(el.object3D);
                        }
                    });
                    console.log('🎯 Sistema de colisiones con raycasting:', this.collidables.length, 'objetos');
                }, 1000);
            },

            tick: function (time, delta) {
                if (!delta) return;

                const el = this.el;
                const data = this.data;
                const speed = data.speed;

                // Obtener dirección de la cámara
                const rotation = el.object3D.rotation;
                const direction = new THREE.Vector3();

                // Resetear velocidad
                this.velocity.set(0, 0, 0);

                // Movimiento WASD
                if (this.keys['w'] || this.keys['arrowup']) {
                    direction.set(0, 0, -1);
                }
                if (this.keys['s'] || this.keys['arrowdown']) {
                    direction.set(0, 0, 1);
                }
                if (this.keys['a'] || this.keys['arrowleft']) {
                    direction.set(-1, 0, 0);
                }
                if (this.keys['d'] || this.keys['arrowright']) {
                    direction.set(1, 0, 0);
                }

                // Si no hay movimiento, salir
                if (direction.length() === 0) return;

                // Rotar dirección según la cámara
                direction.applyEuler(rotation);
                direction.y = 0; // Mantener movimiento horizontal
                direction.normalize();

                // Verificar colisión en la dirección del movimiento
                const position = el.object3D.position;
                this.raycaster.set(position, direction);
                this.raycaster.far = this.checkDistance;

                const intersects = this.raycaster.intersectObjects(this.collidables, true);

                // Si hay colisión cerca, no moverse
                if (intersects.length > 0 && intersects[0].distance < this.checkDistance) {
                    console.log('🚫 Movimiento bloqueado por colisión');
                    return;
                }

                // Aplicar movimiento
                position.x += direction.x * speed;
                position.z += direction.z * speed;
            }
        });

        // Sistema de música aleatoria
        const musicTracks = [
            'sounds/mario_music.mp3',
            'sounds/mario_music_2.mp3',
            'sounds/mario_music_3.mp3',
            'sounds/mario_music_4.mp3',
            'sounds/mario_music_5.mp3',
            'sounds/mario_music_6.mp3'
        ];

        let musicAudio = null;
        let coinAudio = null;
        let audioReady = false;
        let currentTrackIndex = -1;
        let playedTracks = []; // Para evitar repetir canciones consecutivas

        // Función para elegir una pista aleatoria (sin repetir la anterior)
        function getRandomTrackIndex() {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * musicTracks.length);
            } while (newIndex === currentTrackIndex && musicTracks.length > 1);

            return newIndex;
        }

        // Función para reproducir una pista aleatoria
        function playRandomTrack() {
            if (!audioReady) return;

            // Detener música actual si hay una
            if (musicAudio) {
                musicAudio.pause();
                musicAudio.currentTime = 0;
            }

            // Elegir nueva pista
            currentTrackIndex = getRandomTrackIndex();
            const trackPath = musicTracks[currentTrackIndex];

            console.log(`🎵 Reproduciendo: ${trackPath.split('/').pop()}`);

            // Crear nuevo objeto Audio
            musicAudio = new Audio(trackPath);
            musicAudio.volume = 0.4;

            // Cuando termine, reproducir otra aleatoria
            musicAudio.addEventListener('ended', () => {
                console.log('🎵 Canción terminada, cambiando a otra...');
                playRandomTrack();
            });

            // Reproducir
            musicAudio.play()
                .then(() => {
                    console.log('✅ Música reproduciendo correctamente');
                })
                .catch(error => {
                    console.error('❌ Error reproduciendo música:', error);
                });
        }

        // Precargar audios
        function loadAudio() {
            try {
                // Precargar todas las pistas de música
                musicTracks.forEach((track, index) => {
                    const audio = new Audio(track);
                    audio.addEventListener('canplaythrough', () => {
                        console.log(`✅ Pista ${index + 1} cargada:`, track.split('/').pop());
                    }, { once: true });

                    audio.addEventListener('error', (e) => {
                        console.error(`❌ Error cargando ${track}`);
                    }, { once: true });
                });

                // Cargar sonido de moneda
                coinAudio = new Audio('sounds/coin.mp3');
                coinAudio.volume = 1.0;

                coinAudio.addEventListener('canplaythrough', () => {
                    console.log('✅ Sonido de moneda cargado correctamente');
                }, { once: true });

                coinAudio.addEventListener('error', (e) => {
                    console.error('❌ Error cargando sounds/coin.mp3');
                }, { once: true });

                audioReady = true;
                console.log('🎵 Sistema de audio inicializado con', musicTracks.length, 'pistas');

            } catch (error) {
                console.error('❌ Error inicializando audio:', error);
            }
        }

        window.addEventListener('load', loadAudio);

        // Iniciar música aleatoria
        document.getElementById('start-button').addEventListener('click', function () {
            if (!audioReady) {
                console.warn('⚠️ Audio no está listo todavía');
                return;
            }

            // Reproducir primera pista aleatoria
            playRandomTrack();

            // Ocultar el botón
            this.classList.add('hidden');
        });

        // Click en el bloque
        window.addEventListener('load', function () {
            const questionBlock = document.querySelector('#question-block');
            const gltfModel = questionBlock.querySelector('a-gltf-model');
            const fallbackBlock = document.querySelector('#fallback-block');

            if (!questionBlock) {
                console.error('❌ No se encontró el bloque de pregunta');
                return;
            }

            // Función para reproducir sonido
            function playCoinSound() {
                console.log('🪙 ¡Click detectado en el bloque!');

                if (!audioReady || !coinAudio) {
                    console.warn('⚠️ Audio de moneda no está listo');
                    return;
                }

                coinAudio.currentTime = 0;
                const playPromise = coinAudio.play();

                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('🪙 ¡Sonido de moneda reproduciendo!');
                        })
                        .catch(error => {
                            if (error.name !== 'NotAllowedError') {
                                console.error('❌ Error reproduciendo moneda:', error.message);
                            }
                        });
                }

                // Animación de golpe
                questionBlock.setAttribute('animation__hit', {
                    property: 'position',
                    to: '0 1.65 -5',
                    dur: 100,
                    dir: 'alternate',
                    loop: 1
                });
            }

            // Agregar evento click al bloque principal
            questionBlock.addEventListener('click', playCoinSound);

            // También al modelo GLTF cuando cargue
            if (gltfModel) {
                gltfModel.addEventListener('model-loaded', () => {
                    console.log('✅ Modelo 3D GLTF cargado correctamente');
                    // Asegurar que el modelo también sea clickeable
                    gltfModel.addEventListener('click', playCoinSound);
                });

                gltfModel.addEventListener('model-error', (error) => {
                    console.error('❌ Error cargando modelo GLTF:', error);
                    if (fallbackBlock) {
                        fallbackBlock.setAttribute('visible', 'true');
                        fallbackBlock.addEventListener('click', playCoinSound);
                    }
                });
            }

            // Timeout de seguridad
            setTimeout(() => {
                const modelLoaded = gltfModel && gltfModel.components['gltf-model'] && gltfModel.components['gltf-model'].model;
                if (!modelLoaded) {
                    console.warn('⚠️ Modelo GLTF tardó demasiado en cargar');
                    if (fallbackBlock) {
                        fallbackBlock.setAttribute('visible', 'true');
                        fallbackBlock.addEventListener('click', playCoinSound);
                    }
                }
            }, 3000);
        });