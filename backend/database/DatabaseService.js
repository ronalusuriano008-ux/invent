const fs = require('fs');
const path = require('path');

const writeQueues = new Map();

class DatabaseService {
  constructor(fileName) {
    this.fileName = fileName;
    this.filePath = path.join(__dirname, `${fileName}.json`);
    this.seedFilePath = path.join(__dirname, 'seed-data.json');
  }

  _enqueueWrite(operation) {
    const pendingQueue = writeQueues.get(this.filePath) || Promise.resolve();
    const nextQueue = pendingQueue.then(() => operation(), () => operation());
    writeQueues.set(this.filePath, nextQueue.catch(() => {}));
    return nextQueue;
  }

  readSeedData() {
    try {
      if (!fs.existsSync(this.seedFilePath)) {
        return {};
      }
      const contenido = fs.readFileSync(this.seedFilePath, 'utf-8');
      return JSON.parse(contenido);
    } catch (error) {
      console.warn(`No fue posible cargar la semilla ${this.seedFilePath}:`, error);
      return {};
    }
  }

  seedIfNeeded(data) {
    const seedData = this.readSeedData();
    if (!seedData || !seedData[this.fileName]) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.length > 0 ? data : seedData[this.fileName];
    }

    if (data && Array.isArray(data[this.fileName]) && data[this.fileName].length > 0) {
      return data;
    }

    return {
      ...data,
      [this.fileName]: seedData[this.fileName],
      nextId: (seedData.nextId || seedData[this.fileName].length + 1)
    };
  }

  /**
   * Lee el archivo JSON de forma sincrónica
   * @returns {Object} Contenido del archivo
   */
  read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return this.seedIfNeeded({});
      }

      const contenido = fs.readFileSync(this.filePath, 'utf-8').trim();
      if (!contenido) {
        return this.seedIfNeeded({});
      }

      const data = JSON.parse(contenido);
      return this.seedIfNeeded(data);
    } catch (error) {
      console.error(`Error leyendo ${this.filePath}:`, error);
      return this.seedIfNeeded({});
    }
  }

  writeSync(data) {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.filePath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
      return true;
    } catch (error) {
      console.error(`Error escribiendo ${this.filePath}:`, error);
      return false;
    }
  }

  /**
   * Escribe datos en el archivo JSON de forma sincrónica
   * @param {Object} data Datos a escribir
   */
  async write(data) {
    return this._enqueueWrite(() => this.writeSync(data));
  }

  /**
   * Obtiene todos los registros
   * @returns {Array}
   */
  getAll() {
    const data = this.read();

    if (Array.isArray(data)) {
      return data;
    }

    return data[this.fileName] || data.productos || data.movimientos || data.categorias || [];
  }

  /**
   * Obtiene un registro por ID
   * @param {Number} id
   * @returns {Object|null}
   */
  getById(id) {
    const items = this.getAll();
    return items.find(item => item.id === parseInt(id)) || null;
  }

  /**
   * Crea un nuevo registro
   * @param {Object} newItem
   * @returns {Object} Item con ID asignado
   */
  async create(newItem) {
    return this._enqueueWrite(() => {
      const data = this.read();
      const items = data[this.fileName] || data.productos || data.movimientos || data.categorias || [];

      newItem.id = data.nextId || 1;
      items.push(newItem);

      data.nextId = (data.nextId || 1) + 1;
      data[this.fileName] = items;
      if (data.productos !== undefined) data.productos = items;
      if (data.movimientos !== undefined) data.movimientos = items;
      if (data.categorias !== undefined) data.categorias = items;

      this.writeSync(data);
      return newItem;
    });
  }

  /**
   * Actualiza un registro
   * @param {Number} id
   * @param {Object} updatedItem
   * @returns {Object|null}
   */
  async update(id, updatedItem) {
    return this._enqueueWrite(() => {
      const data = this.read();
      const items = data[this.fileName] || data.productos || data.movimientos || data.categorias || [];

      const index = items.findIndex(item => item.id === parseInt(id));
      if (index === -1) return null;

      items[index] = { ...items[index], ...updatedItem, id: parseInt(id) };

      data[this.fileName] = items;
      if (data.productos !== undefined) data.productos = items;
      if (data.movimientos !== undefined) data.movimientos = items;
      if (data.categorias !== undefined) data.categorias = items;

      this.writeSync(data);
      return items[index];
    });
  }

  /**
   * Elimina un registro
   * @param {Number} id
   * @returns {Boolean}
   */
  async delete(id) {
    return this._enqueueWrite(() => {
      const data = this.read();
      const items = data[this.fileName] || data.productos || data.movimientos || data.categorias || [];

      const index = items.findIndex(item => item.id === parseInt(id));
      if (index === -1) return false;

      items.splice(index, 1);

      data[this.fileName] = items;
      if (data.productos !== undefined) data.productos = items;
      if (data.movimientos !== undefined) data.movimientos = items;
      if (data.categorias !== undefined) data.categorias = items;

      this.writeSync(data);
      return true;
    });
  }

  /**
   * Busca registros por campo
   * @param {String} field
   * @param {any} value
   * @returns {Array}
   */
  findBy(field, value) {
    const items = this.getAll();
    return items.filter(item => item[field] === value);
  }

  /**
   * Busca registros que contengan texto (case-insensitive)
   * @param {String} field
   * @param {String} searchText
   * @returns {Array}
   */
  search(field, searchText) {
    const items = this.getAll();
    const text = searchText.toLowerCase();
    return items.filter(item =>
      String(item[field]).toLowerCase().includes(text)
    );
  }
}

module.exports = DatabaseService;
