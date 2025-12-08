export interface Bus {
    id: string;
    code: string;
    numberPlate: string;
    routeId: string;
    routeName: string;
    currentStop: string;
    nextStop: string;
    etaNextStop: string; // e.g. "5 mins"
    occupancy: "Low" | "Medium" | "High" | "Full";
    lat: number;
    lng: number;
}

export interface Ticket {
    id: string;
    busCode: string;
    routeName: string;
    from: string;
    to: string;
    passengers: number;
    amount: number;
    date: string;
    status: "Active" | "Used" | "Expired";
    qrCode: string;
}

export const MOCK_BUSES: Bus[] = [
    {
        id: "1",
        code: "402",
        numberPlate: "KA-01-F-4002",
        routeId: "R5",
        routeName: "City Center - Airport",
        currentStop: "Market",
        nextStop: "Central Station",
        etaNextStop: "5 mins",
        occupancy: "Medium",
        lat: 12.9716,
        lng: 77.5946,
    },
    {
        id: "2",
        code: "405",
        numberPlate: "KA-05-A-1234",
        routeId: "R2",
        routeName: "Majestic - Whitefield",
        currentStop: "Indiranagar",
        nextStop: "Domlur",
        etaNextStop: "12 mins",
        occupancy: "High",
        lat: 12.9784,
        lng: 77.6408,
    },
    {
        id: "3",
        code: "101",
        numberPlate: "KA-53-M-9999",
        routeId: "R1",
        routeName: "Silk Board - Hebbal",
        currentStop: "Koramangala",
        nextStop: "Dairy Circle",
        etaNextStop: "2 mins",
        occupancy: "Low",
        lat: 12.9352,
        lng: 77.6245,
    },
];

export const MOCK_TICKETS: Ticket[] = [
    {
        id: "T12345",
        busCode: "402",
        routeName: "City Center - Airport",
        from: "Market",
        to: "Central Station",
        passengers: 1,
        amount: 25,
        date: "Today, 10:30 AM",
        status: "Active",
        qrCode: "mock-qr-data",
    },
    {
        id: "T12340",
        busCode: "101",
        routeName: "Silk Board - Hebbal",
        from: "Silk Board",
        to: "Koramangala",
        passengers: 2,
        amount: 40,
        date: "Yesterday, 6:00 PM",
        status: "Used",
        qrCode: "mock-qr-data-old",
    },
];
