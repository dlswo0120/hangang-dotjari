/* ================= duck boats & dock ================= */
const DOCK = { x: 94, z: 0.6 };
const dock = new THREE.Group();
{ const wood = mat(0x8a6a48);
  const d = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 2.6), wood); d.position.set(0, -0.15, -1.1); dock.add(d);
  for (let x = -8; x <= 8; x += 4) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.6, 6), wood); p.position.set(x, -0.6, -2.3); dock.add(p); }
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.95, 0.12), mat(0xffd54a)); sign.position.set(-6.5, 1.85, 1.8); dock.add(sign);
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.9, 6), mat(0x3d4247)); sp.position.set(-6.5, 0.95, 1.7); dock.add(sp);
}
dock.position.set(DOCK.x, 0, 0); scene.add(dock);
const BOAT_HOME = [[88, -4.4], [94, -4.4], [100, -4.4]];
const SEATS = [new THREE.Vector3(-0.42, 0.68, 0.18), new THREE.Vector3(0.42, 0.68, 0.18), new THREE.Vector3(0, 0.98, 1.05)];
const SINK_TIME = 9;
function makeDuckBoat(tint) {
  const g = new THREE.Group(), duckM = mat(tint), duckD = mat(new THREE.Color(tint).multiplyScalar(0.86).getHex()), whiteM = mat(0xfbf8f0);
  const beakM = mat(0xf5902a), beakD = mat(0xd9731a), eyeB = new THREE.MeshBasicMaterial({ color: 0x1d1a18 }), eyeW = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1, parent = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; parent.add(o); return o; };
  const SPH = new THREE.SphereGeometry(1, 20, 14);
  // body
  add(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), duckM, 0, 0.5, 0, 1.25, 0.8, 2.0);
  const side = add(new THREE.CylinderGeometry(1, 1, 0.34, 32, 1, true), mat(tint, { side: THREE.DoubleSide }), 0, 0.66, 0, 1.25, 1, 2.0);
  const rim = add(new THREE.TorusGeometry(1, 0.07, 8, 40), whiteM, 0, 0.83, 0, 1.25, 2.0, 1); rim.rotation.x = Math.PI / 2;
  const floor = add(new THREE.CircleGeometry(1, 28), mat(0xe8dcc4), 0, 0.5, 0, 1.15, 1.9, 1); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  [-1, 1].forEach(k => { const w = add(SPH, duckD, k * 1.2, 0.72, 0.4, 0.17, 0.36, 0.85); w.rotation.z = k * 0.25; });
  // neck, head, face
  const neck = add(new THREE.CylinderGeometry(0.36, 0.48, 1.05, 16), duckM, 0, 1.2, -1.62); neck.rotation.x = 0.2;
  add(SPH, duckM, 0, 2.0, -1.86, 0.68, 0.66, 0.66);
  [-1, 1].forEach(k => {
    add(SPH, eyeW, k * 0.3, 2.13, -2.38, 0.17, 0.19, 0.08);
    add(SPH, eyeB, k * 0.3, 2.11, -2.45, 0.09, 0.11, 0.04);
    add(SPH, eyeW, k * 0.3 + 0.035, 2.16, -2.49, 0.03, 0.03, 0.02);
    add(SPH, mat(0xffa3a3), k * 0.48, 1.88, -2.25, 0.12, 0.08, 0.06);
  });
  add(SPH, beakM, 0, 1.9, -2.5, 0.42, 0.12, 0.36);
  add(SPH, beakD, 0, 1.79, -2.44, 0.33, 0.08, 0.28);
  [-0.1, 0.05, 0.18].forEach((x, i) => { const t = add(new THREE.ConeGeometry(0.07, 0.3, 6), duckM, x, 2.68, -1.8 + i * 0.05); t.rotation.z = -x * 2; });
  const tail = add(new THREE.ConeGeometry(0.4, 0.8, 10), duckM, 0, 1.08, 1.98); tail.rotation.x = -1.0;
  // canopy
  const post = new THREE.CylinderGeometry(0.035, 0.035, 1.65, 6);
  [[-0.98, -0.5], [0.98, -0.5], [-0.98, 1.3], [0.98, 1.3]].forEach(([x, z]) => add(post, whiteM, x, 1.62, z));
  add(new THREE.BoxGeometry(2.25, 0.08, 2.15), mat(0x4d8fd6), 0, 2.46, 0.4);
  add(new THREE.BoxGeometry(2.3, 0.1, 0.14), whiteM, 0, 2.42, -0.67);
  add(new THREE.BoxGeometry(2.3, 0.1, 0.14), whiteM, 0, 2.42, 1.47);
  // seats: two at the front with pedals, one perched at the back
  add(new THREE.BoxGeometry(1.75, 0.12, 0.5), whiteM, 0, 0.62, 0.2);
  add(new THREE.BoxGeometry(1.75, 0.42, 0.08), whiteM, 0, 0.86, 0.47);
  add(new THREE.BoxGeometry(0.34, 0.4, 0.34), whiteM, 0, 0.72, 1.05);
  add(new THREE.BoxGeometry(0.85, 0.1, 0.48), mat(0xff8fa8), 0, 0.92, 1.05);
  add(new THREE.BoxGeometry(0.85, 0.36, 0.08), mat(0xff8fa8), 0, 1.12, 1.3);
  add(new THREE.BoxGeometry(1.7, 0.36, 0.3), whiteM, 0, 0.78, -0.95);
  const wheelT = add(new THREE.TorusGeometry(0.16, 0.03, 6, 16), mat(0x3a3d42), -0.42, 1.08, -0.82); wheelT.rotation.x = -0.6;
  // pedal cranks (one pair for each front seat)
  const crank = new THREE.Group(); crank.position.set(0, 0.56, -0.22); g.add(crank);
  const hubM = mat(0x8a8f96), pedM = mat(0x3a3d42);
  add(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 8), hubM, 0, 0, 0, 1, 1, 1, crank).rotation.z = Math.PI / 2;
  [-0.42, 0.42].forEach(sx => [-1, 1].forEach(f => {
    const arm = new THREE.Group(); arm.position.x = sx + f * 0.1; arm.rotation.x = f > 0 ? Math.PI : 0; crank.add(arm);
    add(new THREE.BoxGeometry(0.03, 0.14, 0.04), hubM, 0, 0.07, 0, 1, 1, 1, arm);
    add(new THREE.BoxGeometry(0.1, 0.03, 0.08), pedM, f * 0.04, 0.14, 0, 1, 1, 1, arm);
  }));
  // paddle wheel at the stern
  const wheel = new THREE.Group(); wheel.position.set(0, 0.2, 1.62); g.add(wheel);
  add(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8), hubM, 0, 0, 0, 1, 1, 1, wheel).rotation.z = Math.PI / 2;
  for (let i = 0; i < 6; i++) { const pd = add(new THREE.BoxGeometry(0.42, 0.3, 0.04), whiteM, 0, 0, 0, 1, 1, 1, wheel); const a = i * Math.PI / 3; pd.position.set(0, Math.cos(a) * 0.24, Math.sin(a) * 0.24); pd.rotation.x = -a; }
  // water that fills the hull when it's overloaded
  const fill = add(new THREE.CircleGeometry(1, 28), new THREE.MeshLambertMaterial({ color: 0x4f86a8, transparent: true, opacity: 0.82 }), 0, 0.52, 0, 1.12, 1.85, 1);
  fill.rotation.x = -Math.PI / 2; fill.visible = false; fill.castShadow = false;
  g.userData = { crank, wheel, fill };
  return g;
}
const boats = BOAT_HOME.map(([x, z], i) => {
  const b = makeDuckBoat([0xffd54a, 0xffe07a, 0xf5c542][i]); b.position.set(x, -0.6, z); scene.add(b);
  return { id: i, obj: b, home: [x, z], x, z, r: 0, tx: x, tz: z, tr: 0, crew: null, crank: 0, sink: 0, sinkT: 0, doomed: false };
});

