import { mount } from 'svelte';
import WiringCanvas from '../../src/lib/wiregen/WiringCanvas.svelte';
import diagram from '../sample-diagram.json';

mount(WiringCanvas, {
  target: document.getElementById('app'),
  props: { diagram },
});
