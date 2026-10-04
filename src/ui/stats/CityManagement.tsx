import {cityBenefits, climateStats, energyStats, transportStats} from '../../core';
import {t} from '../../i18n/t';
import {useGame, useUi} from '../common/hooks';
import {CloseButton} from '../common/CloseButton';
import {ServicesSection} from '../buildings/ServicesSection';
import {CityOverview} from './management/CityOverview';
import {EmissionsSection} from './management/EmissionsSection';
import {EnergySection} from './management/EnergySection';
import {NatureSection} from './management/NatureSection';
import {NextUnlockSection} from './management/NextUnlockSection';
import {ObjectivesSection} from './management/ObjectivesSection';
import {ProductionSection} from './management/ProductionSection';
import {SectionNavigation} from './management/SectionNavigation';
import {TransportSection} from './management/TransportSection';
import {WaterSection} from './management/WaterSection';
import {WellbeingSection} from './management/WellbeingSection';
import {scrollToSection} from './management/scrollToSection';
import {useModalFocus} from './management/useModalFocus';

export function CityManagement() {
    const state = useGame(s => s.state);
    const open = useUi(s => s.statsOpen);
    const toggle = useUi(s => s.toggleStats);
    const panel = useModalFocus(open, toggle);
    if (!open) return null;
    const energy = energyStats(state);
    const green = cityBenefits(state, energy.coalRates);
    const transport = transportStats(state);
    const climate = climateStats(state);
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
            <CityOverview state={state} energy={energy} green={green} climate={climate} transport={transport} onShowTransport={() => showSection('eco-transport')}/>
            <SectionNavigation onSelect={showSection}/>
            <p className="eco-units">{t('eco.units')}</p>
            <div className="eco-sections">
                <ProductionSection state={state} energy={energy}/>
                <EnergySection state={state} energy={energy} green={green} transport={transport}/>
                <WaterSection state={state}/>
                <ServicesSection state={state}/>
                <NatureSection state={state} green={green}/>
                <WellbeingSection green={green}/>
                <EmissionsSection climate={climate} energy={energy} transport={transport}/>
                <TransportSection transport={transport}/>
                <ObjectivesSection state={state} energy={energy} green={green} transport={transport}/>
                <NextUnlockSection/>
            </div>
        </div>
    </div>;
}
