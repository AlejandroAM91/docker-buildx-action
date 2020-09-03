const core = require('@actions/core');
const exec = require('@actions/exec');

main();

async function main() {
  try {
    const input = getInput();
    await setup();
    if (input.username !== '') {
      await login(input);
    }
    await build(input);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function build(input) {
  let params = ['buildx', 'build'];

  if (input.dockerfile !== '') {
    params.push('-f', input.dockerfile);
  }

  params.push('--platform', input.platform);

  if (input.repository !== '') {
    input.tags.split(',')
      .map(tag => `${input.repository}:${tag.trim()}`)
      .forEach(img => params.push('-t', img));
  }

  if (input.push) {
    params.push('--push');
  } else {
    params.push('--load');
  }

  if (input.target !== '') {
    params.push('--target', input.target);
  }

  if (input.cache_from !== '') {
    params.push('--cache-from', input.cache_from);
  }

  if (input.cache_to !== '') {
    params.push('--cache-to', input.cache_to);
  }
  
  params.push('.');
  try {
    await exec.exec('docker', params);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function login(input) {
  let params = ['login'];
  params.push('-u', input.username);
  params.push('-p', input.password);
  try {
    await exec.exec('docker', params);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function setup() {
  try {
    await exec.exec('docker run --rm --privileged docker/binfmt:a7996909642ee92942dcd6cff44b9b95f08dad64');
    await exec.exec('docker run --rm --privileged multiarch/qemu-user-static --reset -p yes');
    await exec.exec('docker buildx create --name actions-builder --use');
    await exec.exec('docker buildx inspect --bootstrap');
  } catch (error) {
    core.setFailed(error.message);
  }
}

function getInput() {
  return {
    cache_from: core.getInput('cache_from'),
    cache_to: core.getInput('cache_to'),
    dockerfile: core.getInput('dockerfile'),
    platform: core.getInput('platform'),
    password: core.getInput('password'),
    push: (core.getInput('push') === 'true'),
    repository: core.getInput('repository'),
    tag_with_ref: core.getInput('tag_with_ref'),
    tags: core.getInput('tags'),
    target: core.getInput('target'),
    username: core.getInput('username'),
  };
}
