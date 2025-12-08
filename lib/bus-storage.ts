// Bus storage utilities using localStorage

export interface BusStop {
    id: string;
    name: string;
    arrivalTime: string; // HH:MM format
    sequence: number;
}

export interface Bus {
    id: string;
    ownerId: string;
    registrationNumber: string;
    refNumber: string;
    routeFrom: string;
    routeTo: string;
    stops: BusStop[];
    createdAt: string;
}

const BUSES_KEY = "go_bus_buses";

// Get all buses
export function getAllBuses(): Bus[] {
    if (typeof window === "undefined") return [];
    const busesJson = localStorage.getItem(BUSES_KEY);
    return busesJson ? JSON.parse(busesJson) : [];
}

// Save buses
function saveBuses(buses: Bus[]): void {
    localStorage.setItem(BUSES_KEY, JSON.stringify(buses));
}

// Generate reference number
function generateRefNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BUS${timestamp}${random}`;
}

// Create bus
export function createBus(
    ownerId: string,
    registrationNumber: string,
    routeFrom: string,
    routeTo: string
): Bus {
    const buses = getAllBuses();

    const existingBus = buses.find(
        (b) => b.registrationNumber.toLowerCase() === registrationNumber.toLowerCase()
    );

    if (existingBus) {
        throw new Error("Bus with this registration number already exists");
    }

    const newBus: Bus = {
        id: Date.now().toString(),
        ownerId,
        registrationNumber: registrationNumber.toUpperCase(),
        refNumber: generateRefNumber(),
        routeFrom,
        routeTo,
        stops: [],
        createdAt: new Date().toISOString(),
    };

    buses.push(newBus);
    saveBuses(buses);

    return newBus;
}

// Get buses by owner
export function getBusesByOwner(ownerId: string): Bus[] {
    const buses = getAllBuses();
    return buses.filter((b) => b.ownerId === ownerId);
}

// Get bus by ID
export function getBusById(busId: string): Bus | null {
    const buses = getAllBuses();
    return buses.find((b) => b.id === busId) || null;
}

// Add stop to bus
export function addStopToBus(
    busId: string,
    stopName: string,
    arrivalTime: string
): Bus {
    const buses = getAllBuses();
    const busIndex = buses.findIndex((b) => b.id === busId);

    if (busIndex === -1) {
        throw new Error("Bus not found");
    }

    const bus = buses[busIndex];
    const newStop: BusStop = {
        id: Date.now().toString(),
        name: stopName,
        arrivalTime,
        sequence: bus.stops.length + 1,
    };

    bus.stops.push(newStop);
    saveBuses(buses);

    return bus;
}

// Update bus stops
export function updateBusStops(busId: string, stops: BusStop[]): Bus {
    const buses = getAllBuses();
    const busIndex = buses.findIndex((b) => b.id === busId);

    if (busIndex === -1) {
        throw new Error("Bus not found");
    }

    buses[busIndex].stops = stops;
    saveBuses(buses);

    return buses[busIndex];
}

// Delete bus
export function deleteBus(busId: string): void {
    const buses = getAllBuses();
    const filteredBuses = buses.filter((b) => b.id !== busId);
    saveBuses(filteredBuses);
}

// Delete stop from bus
export function deleteStopFromBus(busId: string, stopId: string): Bus {
    const buses = getAllBuses();
    const busIndex = buses.findIndex((b) => b.id === busId);

    if (busIndex === -1) {
        throw new Error("Bus not found");
    }

    const bus = buses[busIndex];
    bus.stops = bus.stops.filter((s) => s.id !== stopId);

    // Resequence stops
    bus.stops.forEach((stop, index) => {
        stop.sequence = index + 1;
    });

    saveBuses(buses);
    return bus;
}
