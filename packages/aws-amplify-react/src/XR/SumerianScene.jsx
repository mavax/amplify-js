/*
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
import * as React from 'react';
import XR from '@moixa-energy/xr';
import { ConsoleLogger as Logger } from '@moixa-energy/core';
import IconButton from './IconButton';
import Loading from './Loading';
import * as AmplifyUI from '@moixa-energy/ui';

const SCENE_CONTAINER_DOM_ID = 'scene-container-dom-id';
const SCENE_DOM_ID = 'scene-dom-id';

const logger = new Logger('SumerianScene');

class SumerianScene extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showEnableAudio: false,
      muted: false,
      loading: true,
      percentage: 0,
      isFullscreen: false,
      sceneError: null
    };
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve)
    });
  }

  componentDidMount() {
    document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    document.addEventListener('webkitfullscreenchange', this.onFullscreenChange.bind(this));
    document.addEventListener('mozfullscreenchange', this.onFullscreenChange.bind(this));
    document.addEventListener('MSFullscreenChange', this.onFullscreenChange.bind(this));

    this.loadAndSetupScene(this.props.sceneName, SCENE_DOM_ID)
  }

  componentWillUnmount() {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange.bind(this));
    document.removeEventListener('mozfullscreenchange', this.onFullscreenChange.bind(this));
    document.removeEventListener('MSFullscreenChange', this.onFullscreenChange.bind(this));
  }
  
  async loadAndSetupScene(sceneName, sceneDomId) {
    this.setStateAsync({ loading: true });
    const sceneOptions = { 
      progressCallback: (progress) => {
        const percentage = progress * 100;
        this.setState({ percentage });
      }
    };
    try {
      await XR.loadScene(sceneName, sceneDomId, sceneOptions);
    } catch (e) {
      const sceneError = {
        displayText: 'Failed to load scene',
        error: e
      }
      logger.error(sceneError.displayText, sceneError.error);
      this.setStateAsync({sceneError});
      return;
    }
    
    XR.start(sceneName);

    this.setStateAsync({ 
      muted: XR.isMuted(sceneName),
      loading: false
    });

    XR.onSceneEvent(sceneName, 'AudioEnabled', () => this.setStateAsync({showEnableAudio: false}));
    XR.onSceneEvent(sceneName, 'AudioDisabled', () => this.setStateAsync({showEnableAudio: true}));
  }
  
  setMuted(muted) {
    if (this.state.showEnableAudio) {
      XR.enableAudio(this.props.sceneName);
      this.setState({showEnableAudio: false});
    }

    XR.setMuted(this.props.sceneName, muted);
    this.setState({ muted: muted });
  }

  onFullscreenChange() {
    const doc = document;
    this.setState({ isFullscreen: doc.fullscreenElement !== null });
  }

  async maximize() {
    const sceneDomElement = document.getElementById(SCENE_CONTAINER_DOM_ID);
    await sceneDomElement.requestFullScreen();
  }

  async minimize() {
    const doc = document;
    if(doc.exitFullscreen) {
      doc.exitFullscreen();
    } else if(doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if(doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    }
  }

  render() {
    let muteButton;
    let enterVRButton;
    let screenSizeButton;

    if (XR.isSceneLoaded(this.props.sceneName)) {
      if (this.state.showEnableAudio) {
        muteButton = <IconButton variant="sound-mute" tooltip="The scene is muted. Click to unmute." onClick={() => this.setMuted(false)} autoShowTooltip />
      } else if (XR.isMuted(this.props.sceneName)) {
        muteButton = <IconButton variant="sound-mute" tooltip="Unmute" onClick={() => this.setMuted(false)} />
      } else {
        muteButton = <IconButton variant="sound" tooltip="Mute" onClick={() => this.setMuted(true)} />
      }

      if (XR.isVRCapable(this.props.sceneName)) {
        enterVRButton = <IconButton variant="enter-vr" tooltip="Enter VR" onClick={() => XR.enterVR(this.props.sceneName)} />
      }
      if (this.state.isFullscreen) {
        screenSizeButton = <IconButton variant="minimize" tooltip="Exit Fullscreen" onClick={() => this.minimize()} />
      } else {
        screenSizeButton = <IconButton variant="maximize" tooltip="Fullscreen" onClick={() => this.maximize()} />
      }
    }

    return (
      <div id={SCENE_CONTAINER_DOM_ID} className={AmplifyUI.sumerianSceneContainer}>
        <div id={SCENE_DOM_ID} className={AmplifyUI.sumerianScene}>
          {this.state.loading && <Loading sceneName={this.props.sceneName} percentage={this.state.percentage} sceneError={this.state.sceneError}/>}
        </div>
        <div className={AmplifyUI.sceneBar}>
          <span className={AmplifyUI.sceneActions}>
            {muteButton}
            {enterVRButton}
            {screenSizeButton}
          </span>
        </div>
      </div>
    );
  }
}

export default SumerianScene;
