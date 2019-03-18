import "reflect-metadata";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../../test/utils/test-utils";
import { Bar } from "./entity/Bar";

describe("github issues > #2199 - Inserting value for @PrimaryGeneratedColumn() for mysql", () => {

    let connections: Connection[];
    beforeAll(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql", "mariadb"],
        schemaCreate: true,
        dropSchema: true
    }));

    beforeEach(() => reloadTestingDatabases(connections));
    afterAll(() => closeTestingConnections(connections));

    test("should allow to explicitly insert primary key value", () => Promise.all(connections.map(async connection => {

        const firstBarQuery =  connection.manager.create(Bar, {
             id: 10,
            description: "forced id value"
        });
        const firstBar = await connection.manager.save(firstBarQuery);
        expect(firstBar.id).toEqual(10);

        // Mysql stores and tracks AUTO_INCREMENT value for each table,
        // If the new value is higher than the current maximum value or not specified (use DEFAULT),
        // the AUTO_INCREMENT value is updated, so the next value will be higher.
        const secondBarQuery =  connection.manager.create(Bar, {
            description: "default next id value"
        });
        const secondBar = await connection.manager.save(secondBarQuery);
        expect(secondBar.id).toEqual(firstBarQuery.id + 1);

        // If the new value is lower than the current maximum value,
        // the AUTO_INCREMENT value remains unchanged.
        const thirdBarQuery =  connection.manager.create(Bar, {
            id: 5,
            description: "lower forced id value"
        });
        const thirdBar = await connection.manager.save(thirdBarQuery);
        expect(thirdBar.id).toEqual(5);
    })));
});