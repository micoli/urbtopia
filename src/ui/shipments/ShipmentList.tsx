import type { Shipment } from '../../shipments/types';
import { ShipmentRow } from './ShipmentRow';

interface ShipmentListProps {
  title: string;
  shipments: Shipment[];
  direction: 'outgoing' | 'incoming';
  nameOf: (shipment: Shipment) => string;
  waitingForRoom: string[];
  busy: boolean;
  onCancel: (shipmentId: string) => void;
}

export function ShipmentList({ title, shipments, direction, nameOf, waitingForRoom, busy, onCancel }: ShipmentListProps) {
  if (shipments.length === 0) return null;
  return (
    <>
      <h4>{title}</h4>
      <ul className="shipment-list">
        {shipments.map((shipment) => (
          <ShipmentRow key={shipment.id} shipment={shipment} direction={direction} otherCityName={nameOf(shipment)} waitingForRoom={waitingForRoom.includes(shipment.id)} busy={busy} onCancel={() => onCancel(shipment.id)} />
        ))}
      </ul>
    </>
  );
}
