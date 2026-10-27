import {cityBenefits, climateStats, cityTransportStats, congestionStats, energyStats, coolingElements, heatSourceItems, isAdapting, temperatureBreakdown} from '../../core';
import {t} from '../../i18n/t';
import {useState} from 'react';
import {useGame, useUi} from '../common/hooks';
import {Tabs} from '../common/Tabs';
import {CitiesSection} from '../system/CitiesSection';
import {ShipmentsSection} from '../shipments/ShipmentsSection';
import {readRegistry} from '../../persistence/cities';
import {rawSaveStore} from '../../persistence/instance';
import {CloseButton} from '../common/CloseButton';
import {ServicesSection} from '../buildings/ServicesSection';
import {CityOverview} from './management/CityOverview';
import {EmissionsSection} from './management/EmissionsSection';
import {EnergySection} from './management/EnergySection';
import {NeedsSection} from './management/NeedsSection';
import {NatureSection} from './management/NatureSection';
import {NextUnlockSection} from './management/NextUnlockSection';
import {ObjectivesSection} from './management/ObjectivesSection';
import {ProductionSection} from './management/ProductionSection';
import {SectionNavigation} from './management/SectionNavigation';
import {TemperatureSection} from './management/TemperatureSection';
import {TrafficSection} from './management/TrafficSection';
import {TransportMapSection} from './management/transportMap/TransportMapSection';
import {TransportSection} from './management/TransportSection';
import {WasteSection} from './management/WasteSection';
import {WaterSection} from './management/WaterSection';
import {WellbeingSection} from './management/WellbeingSection';
import {scrollToSection} from './management/scrollToSection';
import {useModalFocus} from './management/useModalFocus';

type ManagementTab = 'dashboard' | 'cities' | 'shipments';

function CityManagementDialog() {
    const [tab, setTab] = useState<ManagementTab>('dashboard');
    const state = useGame(s => s.state);
    const open = useUi(s => s.statsOpen);
    const toggle = useUi(s => s.toggleStats);
    const panel = useModalFocus(open, toggle);
    if (!open) return null;
    const multiCity = (readRegistry(rawSaveStore)?.cities.length ?? 0) > 1;
    const tabs: {id: ManagementTab; label: string}[] = [{id: 'dashboard', label: t('eco.tab.dashboard')}, {id: 'cities', label: t('cities.title')}, ...(multiCity ? [{id: 'shipments' as const, label: t('shipments.title')}] : [])];
    const selected = tabs.some(entry => entry.id === tab) ? tab : 'dashboard';
    const energy = energyStats(state);
    const green = cityBenefits(state, energy.coalRates);
    const transport = cityTransportStats(state);
    const climate = climateStats(state);
    const congestion = congestionStats(state);
    const temperature = temperatureBreakdown({climate, energy, transport, cooling: green.cooling, adapting: isAdapting(state)});
    const showSection = (id: string) => scrollToSection(panel.current, id);
    return <div className="dialog-backdrop city-management-backdrop" onClick={event => {
        if (event.target === event.currentTarget) toggle();
    }}>
        <div className="eco-dashboard" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="eco-heading">
            <header className="eco-header">
                <img src={`${import.meta.env.BASE_URL}assets/icons/town-management.png`} alt=""/>
                <h2 id="eco-heading">{t('eco.title')}</h2>
                <CloseButton onClick={toggle}/>
            </header>
            <Tabs label={t('eco.title')} idPrefix="eco-tab" panelId="eco-panel" tabs={tabs} selected={selected} onSelect={setTab}/>
            <div id="eco-panel" role="tabpanel" aria-labelledby={`eco-tab-${selected}`}>
            {selected === 'cities' ? <CitiesSection/> : selected === 'shipments' ? <ShipmentsSection/> : <>
            <CityOverview state={state} energy={energy} green={green} climate={climate} transport={transport} congestion={congestion} onShowTransport={() => showSection('eco-transport')} onShowTraffic={() => showSection('eco-traffic')} onShowNeeds={() => showSection('eco-needs')} onShowTemperature={() => showSection('eco-temperature')} onShowWaste={() => showSection('eco-waste')}/>
            <SectionNavigation onSelect={showSection}/>
            <p className="eco-units">{t('eco.units')}</p>
            <div className="eco-sections">
                <ProductionSection state={state} energy={energy}/>
                <EnergySection state={state} energy={energy} green={green} transport={transport}/>
                <WaterSection state={state}/>
                <ServicesSection state={state}/>
                <NatureSection state={state} green={green}/>
                <WasteSection state={state} onShowEmissions={() => showSection('eco-emissions')}/>
                <NeedsSection state={state} onShowSection={showSection}/>
                <WellbeingSection green={green}/>
                <EmissionsSection climate={climate} energy={energy} transport={transport}/>
                <TemperatureSection breakdown={temperature} elements={coolingElements(state)} items={heatSourceItems(state, {climate, energy, transport, cooling: green.cooling})}/>
                <TransportSection transport={transport}/>
                <TransportMapSection state={state} transport={transport} congestion={congestion}/>
                <TrafficSection state={state} congestion={congestion} transport={transport} onShowTransport={() => showSection('eco-transport')}/>
                <ObjectivesSection state={state} energy={energy} green={green} transport={transport}/>
                <NextUnlockSection/>
            </div>
            </>}
            </div>
        </div>
    </div>;
}

export function CityManagement() {
  const open = useUi((store) => store.statsOpen);
  return open ? <CityManagementDialog /> : null;
}
