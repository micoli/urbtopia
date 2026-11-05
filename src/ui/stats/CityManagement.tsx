import {cityBenefits, climateStats, cityTransportStats, congestionStats, energyStats, coolingElements, heatSourceItems, isAdapting, temperatureBreakdown} from '../../core';
import {t} from '../../i18n/t';
import {useEffect, useRef, type ReactNode} from 'react';
import {useStore} from 'zustand';
import {prefsStore} from '../../i18n/prefsStore';
import {useUi} from '../common/hooks';
import {gameStore} from '../../store/gameStore';
import {useThrottledValue} from '../common/useThrottledValue';
import {Tabs, type TabItem} from '../common/Tabs';
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
import {TourismSection} from './management/TourismSection';
import {TrafficSection} from './management/TrafficSection';
import {RailMetroSection} from './management/railMetro/RailMetroSection';
import {TransportMapSection} from './management/transportMap/TransportMapSection';
import {TransportSection} from './management/TransportSection';
import {WasteSection} from './management/WasteSection';
import {WaterSection} from './management/WaterSection';
import {WellbeingSection} from './management/WellbeingSection';
import {scrollToSection} from './management/scrollToSection';
import {useModalFocus} from './management/useModalFocus';
import {useBackdropClose} from '../common/useBackdropClose';
import type {ManagementGroup, ManagementTab} from '../../store/uiStore';

type DashboardGroup = ManagementGroup;

const GROUP_OF_SECTION: Record<string, DashboardGroup> = {
    'eco-production': 'production', 'eco-energy': 'production', 'eco-water': 'production',
    'eco-services': 'city', 'eco-nature': 'city', 'eco-needs': 'city',
    'eco-waste': 'environment', 'eco-emissions': 'environment', 'eco-temperature': 'environment',
    'eco-traffic': 'transport', 'eco-railMetro': 'transport', 'eco-transport': 'transit', 'eco-transportMap': 'transport',
    'eco-tourism': 'tourism',
};

const DASHBOARD_REFRESH_MS = 4000;

const readState = () => gameStore.getState().state;

function CityManagementDialog() {
    const {tab, group, scroll} = useUi(s => s.managementView);
    const setManagementView = useUi(s => s.setManagementView);
    const setTab = (next: ManagementTab) => setManagementView({tab: next});
    const setGroup = (next: DashboardGroup) => setManagementView({group: next});
    const state = useThrottledValue(readState, DASHBOARD_REFRESH_MS);
    const tabbed = useStore(prefsStore, store => store.managementTabs);
    const open = useUi(s => s.statsOpen);
    const toggle = useUi(s => s.toggleStats);
    const panel = useModalFocus(open, toggle);
    const backdrop = useBackdropClose(toggle);
    const scrollTop = useRef(scroll);
    useEffect(() => {
        if (panel.current) panel.current.scrollTop = scroll;
        return () => setManagementView({scroll: scrollTop.current});
        // Restored once when the window opens, saved once when it closes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    if (!open) return null;
    const multiCity = (readRegistry(rawSaveStore)?.cities.length ?? 0) > 1;
    const tabs: TabItem<ManagementTab>[] = [{id: 'dashboard', icon: 'stats', label: t('eco.tab.dashboard')}, {id: 'cities', icon: 'city', label: t('cities.title')}, ...(multiCity ? [{id: 'shipments' as const, icon: 'shipment' as const, label: t('shipments.title')}] : [])];
    const groupTabs: TabItem<DashboardGroup>[] = [{id: 'overview', icon: 'stats', label: t('eco.tab.overview')}, {id: 'production', icon: 'production', label: t('eco.tab.production')}, {id: 'city', icon: 'services', label: t('eco.tab.city')}, {id: 'environment', icon: 'nature', label: t('eco.tab.environment')}, {id: 'transport', icon: 'transport', label: t('eco.tab.transport')}, {id: 'transit', icon: 'bus', label: t('eco.transport')}, {id: 'tourism', icon: 'tourism', label: t('tourism.title')}];
    const selected = tabs.some(entry => entry.id === tab) ? tab : 'dashboard';
    const energy = energyStats(state);
    const green = cityBenefits(state, energy.coalRates);
    const transport = cityTransportStats(state);
    const climate = climateStats(state);
    const congestion = congestionStats(state);
    const temperature = temperatureBreakdown({climate, energy, transport, cooling: green.cooling, adapting: isAdapting(state)});
    const showSection = (id: string) => {
        const target = GROUP_OF_SECTION[id];
        if (!tabbed || !target || group === target) return scrollToSection(panel.current, id);
        setGroup(target);
        requestAnimationFrame(() => scrollToSection(panel.current, id));
    };
    const overviewSection = <CityOverview state={state} energy={energy} green={green} climate={climate} transport={transport} congestion={congestion} onShowTransport={() => showSection('eco-transport')} onShowTraffic={() => showSection('eco-traffic')} onShowEnergy={() => showSection('eco-energy')} onShowNeeds={() => showSection('eco-needs')} onShowTemperature={() => showSection('eco-temperature')} onShowWaste={() => showSection('eco-waste')} onShowTourism={() => showSection('eco-tourism')}/>;
    const needsSection = <NeedsSection key="needs" state={state} onShowSection={showSection}/>;
    const objectivesSection = <ObjectivesSection key="objectives" state={state} energy={energy} green={green} transport={transport}/>;
    const nextUnlockSection = <NextUnlockSection key="nextUnlock"/>;
    const productionSection = <ProductionSection key="production" state={state} energy={energy}/>;
    const energySection = <EnergySection key="energy" state={state} energy={energy} green={green} transport={transport}/>;
    const waterSection = <WaterSection key="water" state={state}/>;
    const servicesSection = <ServicesSection key="services" state={state}/>;
    const wellbeingSection = <WellbeingSection key="wellbeing" green={green}/>;
    const natureSection = <NatureSection key="nature" state={state} green={green}/>;
    const wasteSection = <WasteSection key="waste" state={state} onShowEmissions={() => showSection('eco-emissions')}/>;
    const emissionsSection = <EmissionsSection key="emissions" climate={climate} energy={energy} transport={transport}/>;
    const temperatureSection = <TemperatureSection key="temperature" breakdown={temperature} elements={coolingElements(state)} items={heatSourceItems(state, {climate, energy, transport, cooling: green.cooling})}/>;
    const trafficSection = <TrafficSection key="traffic" state={state} congestion={congestion} transport={transport} onShowTransport={() => showSection('eco-transport')}/>;
    const railMetroSection = <RailMetroSection key="railMetro" state={state} transport={transport}/>;
    const transportSection = <TransportSection key="transport" transport={transport}/>;
    const transportMapSection = <TransportMapSection key="transportMap" state={state} transport={transport} congestion={congestion}/>;
    const tourismSection = <TourismSection key="tourism" state={state}/>;
    const sections: Record<DashboardGroup, ReactNode[]> = {
        overview: [
            needsSection,
            objectivesSection,
            nextUnlockSection,
        ],
        production: [
            productionSection,
            energySection,
            waterSection,
        ],
        city: [
            servicesSection,
            wellbeingSection,
        ],
        environment: [
            wasteSection,
            natureSection,
            emissionsSection,
            temperatureSection,
        ],
        transport: [
            trafficSection,
            railMetroSection,
        ],
        transit: [
            transportSection,
            transportMapSection,
        ],
        tourism: [
            tourismSection,
        ],
    };
    const plainSections = [
        ...sections.overview,
        ...sections.production,
        ...sections.city,
        ...sections.environment,
        ...sections.transport,
        ...sections.transit,
        ...sections.tourism,
    ];
    return <div className="dialog-backdrop window-backdrop city-management-backdrop" {...backdrop}>
        <div className="eco-dashboard" ref={panel} onScroll={event => { scrollTop.current = event.currentTarget.scrollTop; }} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="eco-heading">
            <header className="eco-header">
                <img src={`${import.meta.env.BASE_URL}assets/icons/town-management.png`} alt=""/>
                <h2 id="eco-heading">{t('eco.title')}</h2>
                <CloseButton onClick={toggle}/>
            </header>
            <Tabs label={t('eco.title')} idPrefix="eco-tab" panelId="eco-panel" tabs={tabs} selected={selected} onSelect={setTab}/>
            <div id="eco-panel" role="tabpanel" aria-labelledby={`eco-tab-${selected}`}>
            {selected === 'cities' ? <CitiesSection/> : selected === 'shipments' ? <ShipmentsSection/> : tabbed ? <>
            <Tabs label={t('eco.tab.dashboard')} idPrefix="eco-group" panelId="eco-group-panel" tabs={groupTabs} selected={group} onSelect={setGroup}/>
            <div id="eco-group-panel" role="tabpanel" aria-labelledby={`eco-group-${group}`}>
            {group === 'overview' && <>{overviewSection}<p className="eco-units">{t('eco.units')}</p></>}
            <div className="eco-sections">{sections[group]}</div>
            </div>
            </> : <>
            {overviewSection}
            <SectionNavigation onSelect={showSection}/>
            <p className="eco-units">{t('eco.units')}</p>
            <div className="eco-sections">{plainSections}</div>
            </>}
            </div>
        </div>
    </div>;
}

export function CityManagement() {
  const open = useUi((store) => store.statsOpen);
  return open ? <CityManagementDialog /> : null;
}
