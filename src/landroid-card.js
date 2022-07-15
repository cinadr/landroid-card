import { LitElement, html, nothing } from 'lit';
import { hasConfigOrEntityChanged, fireEvent } from 'custom-card-helpers';
import registerTemplates from 'ha-template';
import get from 'lodash.get';
import localize from './localize';
import styles from './styles';
import defaultImage from './landroid.svg';
import { version } from '../package.json';
import './landroid-card-editor';
import defaultConfig from './defaults';
import LandroidCardEditor from './landroid-card-editor';

const editorName = 'landroid-card-editor';
customElements.define(editorName, LandroidCardEditor);

registerTemplates();

console.info(
  `%c LANDROID-CARD %c ${version} `,
  'color: white; background: #ec6a36; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 4px 0px 0px 4px;',
  'color: #ec6a36; background: white; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 0px 4px 4px 0px;'
);

// if (!customElements.get('ha-icon-button')) {
//   customElements.define(
//     'ha-icon-button',
//     class extends customElements.get('paper-icon-button') {}
//   );
// }

let langStored;

try {
  langStored = JSON.parse(localStorage.getItem('selectedLanguage'));
} catch (e) {
  langStored = localStorage.getItem('selectedLanguage');
}

class LandroidCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      requestInProgress: Boolean,
    };
  }

  static get styles() {
    return styles;
  }

  static async getConfigElement() {
    return document.createElement(editorName);
  }

  static getStubConfig(hass, entities) {
    const [landroidEntity] = entities.filter(
      (eid) => eid.substr(0, eid.indexOf('.')) === 'vacuum'
    );

    return {
      entity: landroidEntity || '',
      image: 'default',
    };
  }

  get entity() {
    return this.hass.states[this.config.entity];
  }

  get camera() {
    if (!this.hass) {
      return null;
    }
    return this.hass.states[this.config.camera];
  }

  get image() {
    if (this.config.image === 'default') {
      return defaultImage;
    }

    return this.config.image || defaultImage;
  }

  get showName() {
    if (this.config.show_name === undefined) {
      return true;
    }

    return this.config.show_name;
  }

  get showStatus() {
    if (this.config.show_status === undefined) {
      return true;
    }

    return this.config.show_status;
  }

  get showToolbar() {
    if (this.config.show_toolbar === undefined) {
      return true;
    }

    return this.config.show_toolbar;
  }

  get compactView() {
    if (this.config.compact_view === undefined) {
      return false;
    }

    return this.config.compact_view;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error(localize('error.missing_entity'));
    }

    const actions = config.actions;
    if (actions && Array.isArray(actions)) {
      console.warn(localize('warning.actions_array'));
    }

    this.config = {
      ...defaultConfig,
      ...config,
    };

    // this.config = config;
  }

  getCardSize() {
    return this.config.compact_view || false ? 3 : 8;
  }

  shouldUpdate(changedProps) {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  updated(changedProps) {
    if (
      changedProps.get('hass') &&
      changedProps.get('hass').states[this.config.entity].state !==
        this.hass.states[this.config.entity].state
    ) {
      this.requestInProgress = false;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.compactView && this.camera) {
      this.requestUpdate();
      this.thumbUpdater = setInterval(
        () => this.requestUpdate(),
        (this.config.camera_refresh || 5) * 1000
      );
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.camera) {
      clearInterval(this.thumbUpdater);
    }
  }

  handleMore(entityId = this.entity.entity_id) {
    fireEvent(
      this,
      'hass-more-info',
      {
        entityId,
      },
      {
        bubbles: false,
        composed: true,
      }
    );
  }

  // handleSpeed(e) {
  //   const fan_speed = e.target.getAttribute('value');
  //   this.callService('set_fan_speed', { isRequest: false }, { fan_speed });
  // }

  handleAction(action, params = { isRequest: true }) {
    const actions = this.config.actions || {};

    return () => {
      if (!actions[action]) {
        this.callService(params.defaultService || action, {
          isRequest: params.isRequest,
        });
        return;
      }

      this.callAction(actions[action]);
    };
  }

  /**
   * Choose between vacuum and landroid_cloud domain and call service
   * @param {string} service
   * @param {Object} params
   * @param {Object} options Service options
   */
  callService(service, params = { isRequest: true }, options = {}) {
    let domain = 'vacuum';
    const ladroidServices = [
      'poll',
      'config',
      'partymode',
      'setzone',
      'lock',
      'restart',
      'edgecut',
      'ots',
      'schedule',
    ];

    if (ladroidServices.includes(service)) {
      domain = 'landroid_cloud';
    }

    this.hass.callService(domain, service, {
      entity_id: this.config.entity,
      ...options,
    });

    if (params.isRequest) {
      this.requestInProgress = true;
      this.requestUpdate();
    }
  }

  /**
   * Call the action
   * @param {Object} action service, service_data
   */
  callAction(action) {
    const { service, service_data } = action;
    const [domain, name] = service.split('.');
    this.hass.callService(domain, name, service_data);
  }

  /**
   * Determines the attributes for the entity
   * @param {Object} entity
   * @return {AttributesObject}
   */
  getAttributes(entity) {
    const {
      status,
      state,
      // fan_speed,
      // fan_speed_list,

      battery_level,
      battery_icon,
      accessories,
      battery,
      blades,
      error,
      firmware,
      locked,
      mac_address,
      model,
      online,
      orientation,
      rain_sensor,
      schedule,
      serial_number,
      status_info,
      time_zone,
      zone,
      capabilities,
      mqtt_connected,
      supported_landroid_features,
      party_mode_enabled,
      rssi,
      statistics,
      torque,
      state_updated_at,
      device_class,
      friendly_name,
      supported_features,

      // IF Landroid Cloud <= 2.0.3
      battery_voltage,
      battery_temperature,
      total_charge_cycles,
      current_charge_cycles,
      total_blade_time,
      current_blade_time,
      blade_time_reset,
      error_id,
      firmware_version,
      mac,
      pitch,
      roll,
      yaw,
      rain_delay,
      rain_sensor_triggered,
      rain_delay_remaining,
      serial,
      mowing_zone,
      zone_probability,
      work_time,
      distance,
      last_update,
      // ENDIF Landroid Cloud <= 2.0.3
    } = entity.attributes;

    return {
      status: status || state || entity.state,
      // fan_speed,
      // fan_speed_list,

      battery_level,
      battery_icon,
      accessories: accessories || '-',
      battery: battery || {
        cycles: {
          total: total_charge_cycles,
          current: current_charge_cycles,
          reset_at: '-',
          reset_time: '-',
        },
        temperature: battery_temperature,
        voltage: battery_voltage,
        percent: battery_level,
        charging: '-',
      },
      blades: blades || {
        total_on: total_blade_time,
        current_on: current_blade_time,
        reset_at: total_blade_time - current_blade_time,
        reset_time: blade_time_reset,
      },
      error: this.isObject(error)
        ? error
        : { id: error_id, description: error },
      firmware: firmware || { auto_upgrade: '-', version: firmware_version },
      locked,
      mac_address: mac_address || mac,
      model: model || '',
      online,
      orientation: orientation || { pitch: pitch, roll: roll, yaw: yaw },
      rain_sensor: rain_sensor || {
        delay: rain_delay,
        triggered: rain_sensor_triggered,
        remaining: rain_delay_remaining,
      },
      schedule,
      serial_number: serial_number || serial,
      status_info: status_info || {
        id: '-',
        description: status || state || entity.stat,
      },
      time_zone: time_zone || '-',
      zone: model
        ? zone
        : {
            current: '-',
            index: mowing_zone,
            indicies: zone_probability,
            starting_point: zone,
          },
      capabilities: capabilities || '',
      mqtt_connected: mqtt_connected || '',
      supported_landroid_features: supported_landroid_features || '',
      party_mode_enabled,
      rssi,
      statistics: statistics || {
        worktime_blades_on: work_time,
        distance: distance,
        worktime_total: '-',
      },
      torque: torque || '',
      state_updated_at: state_updated_at || last_update,
      device_class,
      friendly_name,
      supported_features,
    };
  }

  minutesToDays(time) {
    return isNaN(Math.floor(time / 1440))
      ? ''
      : `${Math.floor(time / 1440)} ${localize('units.days')}
        ${Math.floor((time % 1440) / 60)} ${localize('units.hours')}
        ${Math.floor((time % 1440) % 60)} ${localize(
          'units.minutes'
        )}`.toLocaleString();
  }

  isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  }

  /**
   * Generates the buttons menu
   * @param {string} type (battery, blades)
   * @return {TemplateResult}
   */
  renderButtonMenu(type) {
    if (!type) {
      return nothing;
    }

    var title = '',
      icon = '',
      unit = '',
      attributes = {};

    switch (type) {
      case 'battery':
        {
          ({
            battery_level: title,
            battery_icon: icon,
            battery: attributes,
          } = this.getAttributes(this.entity));
          unit = '%';
        }
        break;

      case 'stats':
        {
          ({
            battery_level: title,
            battery_icon: icon,
            battery: attributes,
          } = this.getAttributes(this.entity));
          unit = '%';
        }
        break;

      case 'blades':
        {
          let { blades } = this.getAttributes(this.entity);
          icon = 'mdi:fan';
          attributes['total_on'] = this.minutesToDays(blades['total_on']);
          attributes['current_on'] = this.minutesToDays(blades['current_on']);
          attributes['reset_at'] = this.minutesToDays(blades['reset_at']);
          attributes['reset_time'] = new Date(
            blades['reset_time']
          ).toLocaleString(langStored);
        }
        break;

      default:
        {
          ({
            battery_level: title,
            battery_icon: icon,
            battery: attributes,
          } = this.getAttributes(this.entity));
          unit = '%';
        }
        break;
    }

    // if (!attributes) {
    //   return nothing;
    // }

    return html`
      <div class="tip">
        <ha-button-menu @click="${(e) => e.stopPropagation()}">
          <div slot="trigger">
            <span class="icon-title">
              ${localize(`attr.${title}`) || title}${unit}
              <ha-icon icon="${icon}"></ha-icon>
            </span>
          </div>
          ${attributes ? this.renderListItem(attributes) : ''}
        </ha-button-menu>
      </div>
    `;
  }

  /**
   * Generates the list items
   * @param {Object} attributes Object of attributes
   * @param {string} parent Parent element to naming children items
   * @return {TemplateResult}
   */
  renderListItem(attributes = {}, parent = '') {
    if (!attributes) {
      return nothing;
    }

    return html`
      ${Object.keys(attributes).map((item) =>
        this.isObject(attributes[item])
          ? // typeof attributes[item] === 'object' &&
            // attributes[item] !== null &&
            // !Array.isArray(attributes[item])
            this.renderListItem(attributes[item], item)
          : html`
              <mwc-list-item value="${item}">
                ${parent ? localize('attr.' + parent) + ' - ' : ''}
                ${localize('attr.' + item)}:
                ${localize('attr.' + item + '_value_' + attributes[item]) ||
                attributes[item] ||
                '-'}
                ${localize('attr.' + [item] + '_measurement') || ''}
              </mwc-list-item>
            `
      )}
    `;
  }

  /**
   * Generates the WiFi Quality icon
   * @return {TemplateResult}
   */
  renderRSSI() {
    const { rssi } = this.getAttributes(this.entity);

    const wifi_quality = rssi > -101 && rssi < -49 ? (rssi + 100) * 2 : 0;
    const wifi_icon =
      wifi_quality < 100
        ? `mdi:wifi-strength-${Math.floor(wifi_quality / 20)}`
        : 'mdi:wifi-strength-4';

    return html`
      <div
        class="tip"
        title="${localize('attr.rssi')}"
        @click="${() => this.handleMore()}"
      >
        <ha-icon icon="${wifi_icon}"></ha-icon>
        <span class="icon-title">${wifi_quality}%</span>
      </div>
    `;
  }

  /**
   * Generates the Partymode tip icon
   * @param {Boolean} isButton Render icon as a button for toolbar or as an icon for tip
   * @return {TemplateResult}
   */
  renderPartymode(isButton = true) {
    const { party_mode_enabled } = this.getAttributes(this.entity);

    if (isButton) {
      return html`
        <ha-icon-button
          label="${localize('action.partymode')}"
          @click="${this.handleAction('partymode', { isRequest: true })}"
        >
          <ha-icon
            icon="${party_mode_enabled ? 'hass:sleep' : 'hass:sleep-off'}"
          ></ha-icon>
        </ha-icon-button>
      `;
    } else {
      return html`
        <div
          class="tip"
          title="${localize('action.partymode')}"
          @click="${this.handleAction('partymode', { isRequest: false })}"
        >
          <ha-icon
            icon="${party_mode_enabled ? 'hass:sleep' : 'hass:sleep-off'}"
          ></ha-icon>
        </div>
      `;
    }
  }

  /**
   * Generates the Lock tip icon
   * @param {Boolean} isButton Render icon as a button for toolbar or as an icon for tip
   * @return {TemplateResult}
   */
  renderLock(isButton = true) {
    const { lock } = this.getAttributes(this.entity);

    if (isButton) {
      return html`
        <ha-icon-button
          label="${localize('action.lock')}"
          @click="${this.handleAction('lock', { isRequest: true })}"
        >
          <ha-icon icon="${lock ? 'hass:lock' : 'hass:lock-open'}"></ha-icon>
        </ha-icon-button>
      `;
    } else {
      return html`
        <div
          class="tip"
          title="${localize('action.lock')}"
          @click="${this.handleAction('lock', { isRequest: true })}"
        >
          <ha-icon icon="${lock ? 'hass:lock' : 'hass:lock-open'}"></ha-icon>
        </div>
      `;
    }
  }

  /**
   * Generates the Camera or Image
   * @param {string} state State used as a css class
   * @return {TemplateResult}
   */
  renderCameraOrImage(state) {
    if (this.compactView) {
      return nothing;
    }

    if (this.camera) {
      const camera = this.hass.states[this.config.camera];
      return camera && camera.attributes.entity_picture
        ? html`
            <img
              class="camera"
              src="${camera.attributes.entity_picture}&v=${Date.now()}"
              @click=${() => this.handleMore(this.config.camera)}
            />
          `
        : nothing;
    }

    if (this.image) {
      return html`
        <img
          class="landroid ${state}"
          src="${this.image}"
          @click="${() => this.handleMore()}"
        />
      `;
    }

    return nothing;
  }

  /**
   * Generates the Stats
   * @param {string} state State used as a css class
   * @return {TemplateResult}
   */
  renderStats(state) {
    const { stats = {} } = this.config;

    const statsList = stats[state] || stats.default || [];

    return statsList.map(
      ({ entity_id, attribute, value_template, unit, subtitle }) => {
        if (!entity_id && !attribute && !value_template) {
          return nothing;
        }

        const state = entity_id
          ? this.hass.states[entity_id].state
          : get(this.entity.attributes, attribute);

        const value = html`
          <ha-template
            hass=${this.hass}
            template=${value_template}
            value=${state}
            variables=${{ value: state }}
          ></ha-template>
        `;

        return html`
          <div class="stats-block" @click="${() => this.handleMore(entity_id)}">
            <span class="stats-value">${value}</span>
            ${unit}
            <div class="stats-subtitle">${subtitle}</div>
          </div>
        `;
      }
    );
  }

  /**
   * Generates the Name
   * @return {TemplateResult}
   */
  renderName() {
    const { friendly_name } = this.getAttributes(this.entity);

    if (!this.showName) {
      return nothing;
    }

    /**
     * Generates the Status
     * @return {TemplateResult}
     */
    return html`
      <div class="landroid-name" @click="${() => this.handleMore()}">
        ${friendly_name}
      </div>
    `;
  }

  /**
   * Generates the Status
   * @return {TemplateResult}
   */
  renderStatus() {
    if (!this.showStatus) {
      return nothing;
    }

    const { status } = this.getAttributes(this.entity);
    let localizedStatus = localize(`status.${status}`) || status;

    switch (status) {
      case 'rain_delay':
        {
          const { rain_sensor } = this.getAttributes(this.entity);
          localizedStatus += ` (${rain_sensor['remaining']} ${
            localize('units.min') || ''
          })`;
          // localizedStatus += ` (${rain_sensor['remaining'].toString()}
          // ${(localizedStatus = localize(`units.min`) || '')})`;
        }
        break;

      case 'mowing':
        {
          const { zone } = this.getAttributes(this.entity);
          localizedStatus += ` (${localize('attr.zone') || ''}: ${
            zone['current']
          })`;
        }
        break;

      case 'error':
        {
          const { error } = this.getAttributes(this.entity);
          if (error['id'] > 0) {
            localizedStatus += ` ${error['id']}: 
            ${
              localize('error.' + error['description']) || error['description']
            }`;
          }
        }
        break;

      default:
        break;
    }

    return html`
      <div class="status" @click="${() => this.handleMore()}">
        <span class="status-text" alt=${localizedStatus}>
          ${localizedStatus}
        </span>
        <mwc-circular-progress
          .indeterminate=${this.requestInProgress}
          density="-5"
        ></mwc-circular-progress>
      </div>
    `;
  }

  renderButton(action, icon = action, name = action, title = false) {
    if (title) {
      return html`
        <ha-button
          @click="${this.handleAction(action)}"
          title="${localize('action.' + name)}"
        >
          <ha-icon icon="hass:${icon}"></ha-icon>
          ${localize('action.' + name)}
        </ha-button>
      `;
    } else {
      return html`
        <ha-icon-button
          label="${localize('action.' + name)}"
          @click="${this.handleAction(action)}"
        >
          <ha-icon icon="hass:${icon}"></ha-icon>
        </ha-icon-button>
      `;
    }
  }

  renderToolbar(state) {
    if (!this.showToolbar) {
      return nothing;
    }

    switch (state) {
      case 'initializing':
      case 'mowing':
      case 'starting':
      case 'zoning': {
        return html`
          <div class="toolbar">
            ${this.renderPartymode()} ${this.renderLock()}
            ${this.renderButton('pause', 'pause', 'pause', true)}
            <!-- ${this.renderButton('stop', 'stop', 'stop', true)} -->
            ${this.renderButton(
              'return_to_base',
              'home-import-outline',
              'return_to_base',
              true
            )}
          </div>
        `;
      }

      case 'edgecut': {
        return html`
          <div class="toolbar">
            ${this.renderButton('pause', 'motion-pause', 'pause', true)}
            ${this.renderButton('stop', 'stop', 'stop', true)}
            ${this.renderButton(
              'return_to_base',
              'home-import-outline',
              'return_to_base',
              true
            )}
          </div>
        `;
      }

      case 'paused': {
        return html`
          <div class="toolbar">
            <ha-button
              @click="${this.handleAction('resume', {
                defaultService: 'start',
              })}"
              title="${localize('action.resume')}"
            >
              <ha-icon icon="hass:play"></ha-icon>
              ${localize('action.continue')}
            </ha-button>
            ${this.renderButton(
              'return_to_base',
              'home-import-outline',
              'return_to_base',
              true
            )}
          </div>
        `;
      }

      case 'returning': {
        return html`
          <div class="toolbar">
            <ha-button
              @click="${this.handleAction('resume', {
                defaultService: 'start',
              })}"
              title="${localize('action.resume')}"
            >
              <ha-icon icon="hass:play"></ha-icon>
              ${localize('action.continue')}
            </ha-button>
            ${this.renderButton('edgecut', 'motion-play', 'edgecut', true)}
            ${this.renderButton('pause', 'pause', 'pause', true)}
          </div>
        `;
      }

      case 'docked':
      case 'idle':
      case 'rain_delay':
      default: {
        const { shortcuts = [] } = this.config;

        const buttons = shortcuts.map(
          ({ name, service, icon, service_data }) => {
            const execute = () => {
              this.callAction({ service, service_data });
            };
            return html`
              <ha-icon-button label="${name}" @click="${execute}">
                <ha-icon icon="${icon}"></ha-icon>
              </ha-icon-button>
            `;
          }
        );

        const dockButton = html`${this.renderButton(
          'return_to_base',
          'home-import-outline'
        )}`;

        return html`
          <div class="toolbar">
            ${this.renderButton('start', 'play')}
            ${this.renderButton('edgecut', 'motion-play')}
            ${state === 'idle' ? dockButton : ''}
            <div class="fill-gap"></div>
            ${buttons}
          </div>
        `;
      }
    }
  }

  render() {
    if (!this.entity) {
      return html`
        <ha-card>
          <div class="preview not-available">
            <div class="metadata">
              <div class="not-available">
                ${localize('common.not_available')}
              </div>
            </div>
          </div>
        </ha-card>
      `;
    }

    const { state } = this.entity;

    return html`
      <ha-card>
        <div class="preview">
          <div class="header">
            <div class="tips">
              ${this.renderRSSI()}
              <!-- ${this.renderPartymode(false)}
              ${this.renderLock(false)} -->
              ${this.renderButtonMenu('blades')}
              ${this.renderButtonMenu('battery')}
            </div>
            <!-- <ha-icon-button
              class="more-info"
              icon="hass:dots-vertical"
              more-info="true"
              @click="${() => this.handleMore()}">
              <ha-icon icon="mdi:dots-vertical"></ha-icon>
            </ha-icon-button> -->
          </div>

          ${this.renderCameraOrImage(state)}

          <div class="metadata">
            ${this.renderName()} ${this.renderStatus()}
          </div>

          <div class="stats">${this.renderStats(state)}</div>
        </div>

        ${this.renderToolbar(state)}
      </ha-card>
    `;
  }
}

customElements.define('landroid-card', LandroidCard);

window.customCards = window.customCards || [];
window.customCards.push({
  preview: true,
  type: 'landroid-card',
  name: localize('common.name'),
  description: localize('common.description'),
});
