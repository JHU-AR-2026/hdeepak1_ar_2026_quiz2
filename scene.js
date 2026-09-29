/*
HOW TO USE THE THREE TASKS IN WEBXR / QUEST:

Task 1 — Sinusoidal color change:
    Press the A button on the RIGHT controller.
    Press A again to turn the color animation off.

Task 2 — Sinusoidal position change:
    Press the B button on the RIGHT controller.
    The cube moves smoothly up and down.
    Press B again to turn the position animation off.

Task 3 — Sinusoidal scale change:
    Press the RIGHT TRIGGER.
    The cube smoothly grows and shrinks.
    Press the trigger again to turn the scale animation off.

All three effects can be enabled at the same time.

The sinusoidal animations are implemented in
scene.onBeforeRenderObservable. We use elapsed time t and
Math.sin(t) to continuously generate values between -1 and 1.
These values are then shifted/scaled into the ranges needed
for color, position, and scale.
*/

export const createScene = async function (engine, canvas) {

    const scene = new BABYLON.Scene(engine);


    // ---------------------------------------------------------
    // DESKTOP CAMERA
    // ---------------------------------------------------------

    const camera = new BABYLON.FreeCamera(
        "camera",
        new BABYLON.Vector3(0, 1.6, -5),
        scene
    );

    camera.setTarget(
        new BABYLON.Vector3(0, 1, 0)
    );

    camera.attachControl(canvas, true);


    // ---------------------------------------------------------
    // LIGHT
    // ---------------------------------------------------------

    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );


    // ---------------------------------------------------------
    // CUBE
    // ---------------------------------------------------------

    const box = BABYLON.MeshBuilder.CreateBox(
        "box",
        {
            size: 0.4
        },
        scene
    );

    box.position = new BABYLON.Vector3(
        0,
        1,
        -2
    );


    // ---------------------------------------------------------
    // CUBE MATERIAL
    // ---------------------------------------------------------

    const boxMaterial =
        new BABYLON.StandardMaterial(
            "boxMaterial",
            scene
        );

    boxMaterial.diffuseColor =
        new BABYLON.Color3(1, 0, 0);

    box.material = boxMaterial;


    // Allow the cube to be grabbed in XR
    const grabBehavior =
        new BABYLON.SixDofDragBehavior();

    box.addBehavior(grabBehavior);

    box.isPickable = true;


    // ---------------------------------------------------------
    // TASK STATE VARIABLES
    // ---------------------------------------------------------
    //
    // These booleans determine which sinusoidal effects are
    // currently active. The controller buttons toggle them.
    //

    let colorAnimationEnabled = false;
    let positionAnimationEnabled = false;
    let scaleAnimationEnabled = false;


    // We store the cube's default position and scale so that
    // we have a fixed center around which the sine waves act.
    const baseY = box.position.y;
    const baseScale = 1.0;


    // ---------------------------------------------------------
    // SINUSOIDAL ANIMATIONS
    // ---------------------------------------------------------
    //
    // This function runs once before every rendered frame.
    // getDeltaTime() gives the elapsed time since the previous
    // frame in milliseconds.
    //
    // We accumulate that time into t, measured in seconds,
    // and use Math.sin() to produce smooth periodic motion.
    //

    let t = 0;

    scene.onBeforeRenderObservable.add(() => {

        // Convert milliseconds to seconds.
        t += scene.getEngine().getDeltaTime() / 1000;


        // -----------------------------------------------------
        // TASK 1: SINUSOIDAL COLOR CHANGE
        // -----------------------------------------------------

        if (colorAnimationEnabled) {

            /*
            Math.sin() ranges from -1 to 1.

            Adding 1 gives a range of 0 to 2,
            and dividing by 2 gives a range of 0 to 1.

            Using different phase offsets for R, G, and B makes
            the cube smoothly cycle through different colors.
            */

            const red =
                (Math.sin(t) + 1) / 2;

            const green =
                (Math.sin(t + 2) + 1) / 2;

            const blue =
                (Math.sin(t + 4) + 1) / 2;

            boxMaterial.diffuseColor =
                new BABYLON.Color3(
                    red,
                    green,
                    blue
                );

        }


        // -----------------------------------------------------
        // TASK 2: SINUSOIDAL POSITION CHANGE
        // -----------------------------------------------------

        if (positionAnimationEnabled) {

            /*
            The cube's Y-coordinate oscillates around baseY.

            Math.sin(t) ranges from -1 to 1, so multiplying
            by 0.5 means the cube moves 0.5 meters above and
            below its original position.
            */

            box.position.y =
                baseY + 0.5 * Math.sin(t);

        }


        // -----------------------------------------------------
        // TASK 3: SINUSOIDAL SCALE CHANGE
        // -----------------------------------------------------

        if (scaleAnimationEnabled) {

            /*
            We do not want scale to become negative.

            Math.sin(t) ranges from -1 to 1.
            Multiplying by 0.3 gives -0.3 to 0.3.

            Adding that to 1 gives a scale range from
            0.7 to 1.3.
            */

            const scale =
                baseScale + 0.3 * Math.sin(t);

            box.scaling =
                new BABYLON.Vector3(
                    scale,
                    scale,
                    scale
                );

        }

    });


    // ---------------------------------------------------------
    // WEBXR - AR MODE
    // ---------------------------------------------------------

    const xr =
        await scene.createDefaultXRExperienceAsync({

            uiOptions: {
                sessionMode: "immersive-ar"
            },

            optionalFeatures: true

        });


    // ---------------------------------------------------------
    // CONTROLLER DETECTION
    // ---------------------------------------------------------

    xr.input.onControllerAddedObservable.add(
        (controller) => {

            console.log(
                "Controller added:",
                controller.inputSource.handedness
            );


            // We only use the RIGHT controller.
            if (
                controller.inputSource.handedness !== "right"
            ) {
                return;
            }


            controller
                .onMotionControllerInitObservable
                .add((motionController) => {

                    console.log(
                        "Right motion controller ready"
                    );


                    // -------------------------------------------------
                    // FIND THE CONTROLLER BUTTONS
                    // -------------------------------------------------

                    // Quest A button -> Task 1
                    const aButton =
                        motionController.getComponent(
                            "a-button"
                        );

                    // Quest B button -> Task 2
                    const bButton =
                        motionController.getComponent(
                            "b-button"
                        );

                    // Standard XR trigger -> Task 3
                    const trigger =
                        motionController.getComponent(
                            "xr-standard-trigger"
                        );


                    // Print available components if something cannot
                    // be found. This is useful for debugging different
                    // WebXR controllers.
                    if (!aButton || !bButton || !trigger) {

                        console.log(
                            "One or more expected buttons were not found."
                        );

                        console.log(
                            "Available controller components:",
                            motionController.getComponentIds()
                        );

                    }


                    // -------------------------------------------------
                    // TASK 1 — A BUTTON
                    // -------------------------------------------------

                    if (aButton) {

                        aButton
                            .onButtonStateChangedObservable
                            .add(() => {

                                // changes.pressed ensures this only runs
                                // when the pressed state actually changes.
                                //
                                // aButton.pressed ensures we only respond
                                // to the DOWN press, rather than both
                                // pressing and releasing the button.

                                if (
                                    aButton.changes.pressed &&
                                    aButton.pressed
                                ) {

                                    // Toggle Task 1.
                                    colorAnimationEnabled =
                                        !colorAnimationEnabled;

                                    console.log(
                                        "Color animation:",
                                        colorAnimationEnabled
                                    );


                                    // When Task 1 is turned off,
                                    // restore the cube's original red color.
                                    if (!colorAnimationEnabled) {

                                        boxMaterial.diffuseColor =
                                            new BABYLON.Color3(
                                                1,
                                                0,
                                                0
                                            );

                                    }

                                }

                            });

                    }


                    // -------------------------------------------------
                    // TASK 2 — B BUTTON
                    // -------------------------------------------------

                    if (bButton) {

                        bButton
                            .onButtonStateChangedObservable
                            .add(() => {

                                if (
                                    bButton.changes.pressed &&
                                    bButton.pressed
                                ) {

                                    // Toggle Task 2.
                                    positionAnimationEnabled =
                                        !positionAnimationEnabled;

                                    console.log(
                                        "Position animation:",
                                        positionAnimationEnabled
                                    );


                                    // Return the cube to its original
                                    // height when the animation is disabled.
                                    if (!positionAnimationEnabled) {

                                        box.position.y = baseY;

                                    }

                                }

                            });

                    }


                    // -------------------------------------------------
                    // TASK 3 — RIGHT TRIGGER
                    // -------------------------------------------------

                    if (trigger) {

                        trigger
                            .onButtonStateChangedObservable
                            .add(() => {

                                if (
                                    trigger.changes.pressed &&
                                    trigger.pressed
                                ) {

                                    // Toggle Task 3.
                                    scaleAnimationEnabled =
                                        !scaleAnimationEnabled;

                                    console.log(
                                        "Scale animation:",
                                        scaleAnimationEnabled
                                    );


                                    // Return the cube to its original
                                    // size when the animation is disabled.
                                    if (!scaleAnimationEnabled) {

                                        box.scaling =
                                            new BABYLON.Vector3(
                                                1,
                                                1,
                                                1
                                            );

                                    }

                                }

                            });

                    }

                });

        }
    );


    return scene;
};