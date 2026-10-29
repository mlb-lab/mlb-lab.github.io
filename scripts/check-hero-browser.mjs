// Optional browser QA with installed Chrome and Node 24's built-in CDP WebSocket.
// No browser automation dependency or generated screenshots are committed.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const applicationUrl = process.argv[2] || 'http://127.0.0.1:5173/';
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const output = await mkdtemp(join(tmpdir(), 'song-lab-hero-qa-'));
const profile = join(output, 'chrome-profile');

function decodeScreenshot(base64) {
  const png = Buffer.from(base64, 'base64');
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert.equal(png[24], 8, '8-bit screenshot');
  assert([2, 6].includes(png[25]), 'RGB or RGBA screenshot');
  assert.equal(png[28], 0, 'noninterlaced screenshot');
  const channels = png[25] === 6 ? 4 : 3, stride = width * channels;
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset), type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const filtered = inflateSync(Buffer.concat(chunks));
  const pixels = new Uint8Array(height * stride);
  const paeth = (left, up, upperLeft) => {
    const p = left + up - upperLeft, a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - upperLeft);
    return a <= b && a <= c ? left : b <= c ? up : upperLeft;
  };
  for (let y = 0; y < height; y++) {
    const filter = filtered[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const target = y * stride + x;
      const left = x >= channels ? pixels[target - channels] : 0;
      const up = y ? pixels[target - stride] : 0;
      const upperLeft = y && x >= channels ? pixels[target - stride - channels] : 0;
      const correction = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : paeth(left, up, upperLeft);
      pixels[target] = filtered[y * (stride + 1) + 1 + x] + correction;
    }
  }
  return { width, height, channels, pixels };
}

function frameDifference(first, second) {
  const a = decodeScreenshot(first), b = decodeScreenshot(second);
  assert.equal(a.width, b.width); assert.equal(a.height, b.height); assert.equal(a.channels, b.channels);
  let changedPixels = 0, maximumDelta = 0;
  for (let index = 0; index < a.pixels.length; index += a.channels) {
    const delta = Math.max(...[0, 1, 2].map((channel) => Math.abs(a.pixels[index + channel] - b.pixels[index + channel])));
    maximumDelta = Math.max(maximumDelta, delta);
    if (delta > 2) changedPixels++;
  }
  return { changedPixels, maximumDelta };
}

class CDP {
  constructor(socket) {
    this.socket = socket;
    this.counter = 0;
    this.pending = new Map();
    this.events = [];
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (!message.id) return this.events.push(message);
      const item = this.pending.get(message.id);
      if (!item) return;
      clearTimeout(item.timeout);
      this.pending.delete(message.id);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    });
  }
  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return new CDP(socket);
  }
  send(method, params = {}) {
    const id = ++this.counter;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out: ${method}`));
      }, 20000);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async waitFor(expression, label, timeout = 20000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await this.evaluate(`Boolean(${expression})`)) return;
      await pause(100);
    }
    throw new Error(`Timed out waiting for ${label}`);
  }
  close() { this.socket.close(); }
}

let chrome;
let referenceServer;
let browser;
const tabs = [];
const results = [];
let failure;

try {
  const reference = (await readFile(join(root, 'reference/song_lab_genomic_hero_v3.html'), 'utf8'))
    .replace(/<script\b[^>]*src="\/\/lc\.getunicorn\.org[^>]*><\/script>/g, '')
    .replace('https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js', '/three.module.js')
    // Only reflect the user's authorized removals; retain the hidden toggle DOM
    // because the untouched reference script expects to attach its listener.
    .replace('</head>', '<style>.sub,.footer,.note{display:none!important}</style></head>');
  const threeSource = await readFile(join(root, 'node_modules/three/build/three.module.js'));
  referenceServer = createServer((request, response) => {
    if (request.url === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    response.setHeader('Content-Type', request.url === '/three.module.js' ? 'text/javascript' : 'text/html; charset=utf-8');
    response.end(request.url === '/three.module.js' ? threeSource : reference);
  });
  await new Promise((done) => referenceServer.listen(0, '127.0.0.1', done));
  const referenceUrl = `http://127.0.0.1:${referenceServer.address().port}/`;
  const appResponse = await fetch(applicationUrl);
  assert.equal(appResponse.status, 200, 'Start Vite before browser QA');
  chrome = spawn(chromePath, [
    '--headless=new', '--remote-debugging-port=0', '--remote-allow-origins=*',
    `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-background-networking', '--hide-scrollbars',
    '--enable-unsafe-swiftshader', 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' });
  chrome.on('error', (error) => { failure = error; });
  let port;
  for (let i = 0; i < 150; i++) {
    if (failure) throw failure;
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).trim().split('\n'); break; }
    catch { await pause(100); }
  }
  assert(port, 'Chrome did not publish DevToolsActivePort');
  const endpoint = `http://127.0.0.1:${port[0]}`;
  browser = await CDP.connect(`ws://127.0.0.1:${port[0]}${port[1]}`);

  async function openTab(url, width, height, { reduced = false, noWebGL = false } = {}) {
    const target = await (await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' })).json();
    const tab = await CDP.connect(target.webSocketDebuggerUrl);
    tabs.push(tab);
    await tab.send('Page.enable');
    await tab.send('Runtime.enable');
    await tab.send('Log.enable');
    await tab.send('Network.enable');
    await tab.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await tab.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    if (noWebGL) await tab.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        return /webgl/i.test(type) ? null : originalGetContext.call(this, type, ...args);
      };` });
    await tab.send('Page.navigate', { url });
    await tab.waitFor(`document.readyState === 'complete' && document.querySelector('h1')`, 'page load');
    return tab;
  }

  async function screenshot(tab, name) {
    await tab.send('Page.bringToFront');
    await pause(50);
    const { data } = await tab.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const path = join(output, `${name}.png`);
    await writeFile(path, Buffer.from(data, 'base64'));
    return { path, data };
  }

  async function clickSelector(tab, selector) {
    const point = await tab.evaluate(`(()=>{
      const el=document.querySelector(${JSON.stringify(selector)}),r=el.getBoundingClientRect();
      const x=r.x+r.width/2,y=r.y+r.height/2;
      return {x,y,hit:el.contains(document.elementFromPoint(x,y))};
    })()`);
    assert(point.hit, `${selector} is visible and not blocked by the scene`);
    await tab.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await tab.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  }

  function metricsExpression(reference = false) {
    const names = reference
      ? ['.hero', '.copy', '.eyebrow', '.welcome', '.pi', '.headline']
      : ['.genomic-hero', '.genomic-copy', '.genomic-eyebrow', '.genomic-welcome', '.genomic-pi', '.genomic-headline'];
    return `(${JSON.stringify(names)}).map(selector=>{
      const el=document.querySelector(selector),box=el.getBoundingClientRect(),css=getComputedStyle(el);
      return {selector,text:el.innerText,x:box.x,y:box.y,width:box.width,height:box.height,font:css.fontFamily,fontSize:css.fontSize,lineHeight:css.lineHeight};
    })`;
  }

  for (const [name, width, height] of [['desktop', 1440, 900], ['tablet', 768, 1024], ['mobile', 390, 844]]) {
    const actual = await openTab(applicationUrl, width, height);
    await actual.waitFor(`document.querySelector('.genomic-scene')?.dataset.sceneReady === 'true'`, `${name} WebGL scene`);
    assert.equal(await actual.evaluate(`document.querySelectorAll('.genomic-canvas canvas').length`), 1, 'one canvas only');
    assert.equal(await actual.evaluate(`document.querySelectorAll('.genomic-motion,.genomic-tags,.genomic-sub,.genomic-footer,.genomic-note').length`), 0, 'removed Hero controls, tags, tagline and side note stay absent');
    const expected = await openTab(referenceUrl, width, height);
    await expected.waitFor(`document.querySelector('#scene canvas')`, 'reference canvas');
    await pause(250);
    const actualMetrics = await actual.evaluate(metricsExpression());
    const expectedMetrics = await expected.evaluate(metricsExpression(true));
    const differences = actualMetrics.map((item, index) => ({
      selector: item.selector,
      dx: +(item.x - expectedMetrics[index].x).toFixed(2),
      dy: +(item.y - expectedMetrics[index].y).toFixed(2),
      dw: +(item.width - expectedMetrics[index].width).toFixed(2),
      dh: +(item.height - expectedMetrics[index].height).toFixed(2),
    }));
    for (const difference of differences) {
      for (const dimension of ['dx', 'dy', 'dw', 'dh']) assert(Math.abs(difference[dimension]) <= 1,
        `${name} ${difference.selector} ${dimension}: ${difference[dimension]}px differs from reference`);
    }
    const actualShot = await screenshot(actual, `${name}-actual`);
    const referenceShot = await screenshot(expected, `${name}-reference`);
    assert.equal(await actual.evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'no horizontal overflow');
    const rect = await actual.evaluate(`document.querySelector('.genomic-hero').getBoundingClientRect().toJSON()`);
    assert(Math.abs(rect.height - height) <= 1, 'hero fills viewport');
    const sceneBounds = await actual.evaluate(`(()=>{
      const box=(selector)=>document.querySelector(selector).getBoundingClientRect().toJSON();
      return {header:box('.site-header'),scene:box('.genomic-scene'),canvas:box('.genomic-canvas canvas')};
    })()`);
    if (width >= 1051) {
      const clearance = sceneBounds.scene.top - sceneBounds.header.bottom;
      assert(clearance >= 15 && clearance <= 17, `desktop 3D scene clears Header by 16px (actual ${clearance}px)`);
      assert(Math.abs(sceneBounds.canvas.top - sceneBounds.scene.top) <= 1, 'desktop canvas stays within shifted scene');
    } else {
      assert(Math.abs(sceneBounds.scene.top - rect.top) <= 1, 'tablet/mobile scene still starts at Hero top');
      assert(Math.abs(sceneBounds.canvas.top - rect.top) <= 1, 'tablet/mobile canvas placement stays unchanged');
    }
    if (name === 'desktop') {
      const animatedFrame = (await screenshot(actual, 'desktop-auto-frame')).data;
      await pause(300);
      assert(frameDifference(animatedFrame, (await screenshot(actual, 'desktop-auto-frame-later')).data).changedPixels > 100, 'scene animates automatically without controls');
    }
    const headerControl = name === 'desktop' ? '.people-toggle' : '.mobile-toggle';
    await clickSelector(actual, headerControl);
    assert.equal(await actual.evaluate(`document.querySelector('${headerControl}').getAttribute('aria-expanded')`), 'true');
    await actual.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await actual.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    assert.equal(await actual.evaluate(`document.querySelector('${headerControl}').getAttribute('aria-expanded')`), 'false', 'Escape closes the menu');
    results.push({ name, width, height, differences, actualMetrics, expectedMetrics, sceneBounds, screenshots: [actualShot.path, referenceShot.path] });
    await writeFile(join(output, 'report.json'), JSON.stringify({ results }, null, 2));
    if (name === 'desktop') {
      const beforePointer = (await screenshot(actual, 'desktop-before-pointer')).data;
      await actual.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1200, y: 300 });
      await pause(900);
      const afterPointer = (await screenshot(actual, 'desktop-after-pointer')).data;
      assert(frameDifference(beforePointer, afterPointer).changedPixels > 100, 'scene keeps responding during pointer movement');
      await actual.evaluate(`document.querySelector('.genomic-hero').dispatchEvent(new PointerEvent('pointerleave'))`);
      await pause(3000);
      const afterLeave = (await screenshot(actual, 'desktop-after-pointer-leave')).data;
      assert(frameDifference(afterPointer, afterLeave).changedPixels > 100, 'scene remains live after pointer leave');
      await actual.evaluate(`document.querySelector('.navigation a[href$="research/"]').click()`);
      await actual.waitFor(`location.pathname.endsWith('/research/') && !document.querySelector('.genomic-hero')`, 'navigation away');
      await actual.evaluate(`document.querySelector('.brand').click()`);
      await actual.waitFor(`document.querySelector('.genomic-scene')?.dataset.sceneReady === 'true'`, 'return scene');
      assert.equal(await actual.evaluate(`document.querySelectorAll('.genomic-canvas canvas').length`), 1, 'one canvas after navigation');
      await actual.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });
      await pause(200);
      assert.equal(await actual.evaluate(`document.querySelector('.genomic-canvas canvas').clientWidth === document.querySelector('.genomic-canvas').clientWidth`), true, 'canvas resizes');
    }
  }

  const reduced = await openTab(applicationUrl, 1440, 900, { reduced: true });
  await reduced.waitFor(`document.querySelector('.genomic-scene')?.dataset.sceneReady === 'true'`, 'reduced motion scene');
  const reducedFrame = (await screenshot(reduced, 'reduced-motion-static')).data;
  await pause(300);
  assert(frameDifference(reducedFrame, (await screenshot(reduced, 'reduced-motion-static-later')).data).changedPixels <= 12, 'reduced motion is static');
  await reduced.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await pause(100);
  const playing = (await screenshot(reduced, 'motion-preference-resumed')).data;
  await pause(350);
  assert(frameDifference(playing, (await screenshot(reduced, 'motion-preference-resumed-later')).data).changedPixels > 100, 'motion resumes automatically when preference changes');
  await screenshot(reduced, 'reduced-motion');
  const contextLossSupported = await reduced.evaluate(`(()=>{
    const canvas=document.querySelector('.genomic-canvas canvas');
    const context=canvas.getContext('webgl2')||canvas.getContext('webgl');
    const extension=context.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext(); return true;
  })()`);
  assert(contextLossSupported, 'Headless WebGL supports simulated context loss');
  await reduced.waitFor(`!document.querySelector('.genomic-canvas canvas') && document.querySelector('.genomic-fallback svg')`, 'context-loss fallback and canvas cleanup');
  await screenshot(reduced, 'context-loss-fallback');
  const fallback = await openTab(applicationUrl, 390, 844, { noWebGL: true });
  await pause(300);
  await fallback.waitFor(`document.querySelector('.genomic-scene')?.dataset.sceneReady === 'false' && !document.querySelector('.genomic-canvas canvas')`, 'fallback unavailable state');
  assert.equal(await fallback.evaluate(`!!document.querySelector('.genomic-fallback svg')`), true, 'SVG fallback shown');
  await screenshot(fallback, 'mobile-no-webgl');
  const narrow = await openTab(applicationUrl, 320, 740);
  await narrow.waitFor(`document.querySelector('.genomic-scene')?.dataset.sceneReady === 'true'`, 'narrow mobile scene');
  assert.equal(await narrow.evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, '320px has no horizontal overflow');
  assert.equal(await narrow.evaluate(`(()=>{const r=document.querySelector('.genomic-copy').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})()`), true, '320px copy stays within viewport');
  await screenshot(narrow, 'mobile-320-actual');
  const errors = tabs.flatMap((tab, index) => tab.events
    .filter((event) => event.method === 'Runtime.exceptionThrown' || (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error'))
    .map((event) => ({ tab: index, event })));
  // The deliberate no-WebGL check can emit the renderer's expected capability errors.
  const unexpected = errors.filter(({ event }) => !JSON.stringify(event).includes('Error creating WebGL context'));
  assert.deepEqual(unexpected, [], 'No unexpected runtime or hydration errors');
  const loadingErrors = tabs.flatMap((tab, index) => tab.events
    .filter((event) => event.method === 'Network.loadingFailed' && !event.params.canceled && event.params.errorText !== 'net::ERR_ABORTED')
    .map((event) => ({ tab: index, event })));
  assert.deepEqual(loadingErrors, [], 'No failed network loads');
  await writeFile(join(output, 'report.json'), JSON.stringify({ results, errors, loadingErrors }, null, 2));
  console.log(JSON.stringify({ success: true, screenshots: output, checks: ['desktop/tablet/mobile remaining copy bounds match authorized reference within 1px', 'desktop scene clears Header by 16px; tablet/mobile scene placement unchanged', 'removed tagline, tags and motion controls absent', 'WebGL with one canvas and automatic animation', 'pointer movement and leave smoke check', 'header hit-testing, click and Escape', 'route cleanup/remount', 'resize', 'reduced-motion static frames and automatic preference-based resume', 'context-loss fallback and cleanup', 'no-WebGL fallback', '320px overflow and copy bounds', 'no runtime/hydration errors or failed network loads'], results: results.map(({ name, differences, sceneBounds }) => ({ name, differences, sceneTop: sceneBounds.scene.top, headerBottom: sceneBounds.header.bottom })) }, null, 2));
} catch (error) {
  failure = error;
  console.error(error);
  console.error(`QA artifacts: ${output}`);
} finally {
  for (const tab of tabs) tab.close();
  try { await browser?.send('Browser.close'); } catch { /* process may already have exited */ }
  browser?.close();
  if (chrome && chrome.exitCode === null) {
    await Promise.race([new Promise((done) => chrome.once('exit', done)), pause(2000)]);
    if (chrome.exitCode === null) chrome.kill();
  }
  await new Promise((done) => referenceServer ? referenceServer.close(done) : done());
  // Profile is generated exclusively by this process; screenshots/report remain for review.
  const resolvedProfile = resolve(profile);
  if (dirname(resolvedProfile) === resolve(output) && basename(resolvedProfile) === 'chrome-profile') {
    await rm(resolvedProfile, { recursive: true, force: true }).catch(() => {});
  }
}
if (failure) process.exitCode = 1;
