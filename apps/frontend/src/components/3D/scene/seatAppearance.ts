import * as THREE from "three";

export function createSeatAppearance() {
    const seats: { mesh: THREE.Mesh; original: THREE.Material | THREE.Material[]; black: THREE.Material | THREE.Material[]; index: number }[] = [];
    let occupied: boolean[] = [];

    const update = () => {
        for (const seat of seats) seat.mesh.material = occupied[seat.index] ? seat.original : seat.black;
    };

    const setModel = (model: THREE.Group) => {
        model.traverse((object) => {
            const name = object.userData.name || object.name;
            const index = ["user.r1s1", "user.r1s2", "user.r1s3"].indexOf(name);
            if (index === -1) return;
            object.traverse((child) => {
                if (!(child instanceof THREE.Mesh)) return;
                const original = child.material;
                const blackMaterial = (material: THREE.Material) => new THREE.MeshBasicMaterial({ color: 0x000000, side: material.side });
                const black = Array.isArray(original) ? original.map(blackMaterial) : blackMaterial(original);
                seats.push({ mesh: child, original, black, index });
            });
        });
        update();
    };

    return {
        setModel,
        setOccupied: (next: boolean[]) => { occupied = next; update(); },
        dispose: () => {
            for (const seat of seats) {
                seat.mesh.material = seat.original;
                for (const material of Array.isArray(seat.black) ? seat.black : [seat.black]) material.dispose();
            }
        },
    };
}
