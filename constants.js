/* =========================================================================
   constants.js — Game-wide tuning constants. Change these to retune speed, camera and road behaviour.
   Red Van Daredevil · classic scripts, shared global lexical scope
   ========================================================================= */
"use strict";

  /* -----------------------------------------------------------------------
     Tuning constants
     ----------------------------------------------------------------------- */
  const SEG_LEN = 200;
  const ROAD_HALF = 900;
  const CAM_DEPTH = 0.9;
  const CAM_BACK = 760;
  const CAM_HEIGHT = 720;
  const DRAW_DIST = 205;
  let drawDist = DRAW_DIST;
  const MAX_SPEED = 7200;
  const BOOST_SPEED = 8600;
  const START_Z = 900;
  const LANES = [-0.645, 0, 0.645];
  const TAU = Math.PI * 2;
