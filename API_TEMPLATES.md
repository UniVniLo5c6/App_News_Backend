# API Endpoint Templates

Tổng hợp mẫu các endpoint API và response format.

## Auth Endpoints

### Register User
```js
/**
 * Register a new user.
 *
 * Body: { name, email, password }
 * Returns: 201 JSON { id, name, email, verifyToken }
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // validate & hash password
    const user = await User.create({ name, email, passwordHash });
    return res.status(201).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
```

### Login
```js
/**
 * Login user with email and password.
 *
 * Body: { email, password }
 * Returns: 200 JSON { token, refreshToken, user }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // verify & generate tokens
    return res.json({ token, refreshToken, user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
```

## CRUD Resource Templates

### List Items
```js
/**
 * List resources with pagination.
 *
 * Query: ?page=&limit=&filter=
 * Returns: 200 JSON array of items
 */
exports.list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(50, parseInt(req.query.limit || '20'));
    const offset = (page - 1) * limit;
    const items = await Model.findAll({ limit, offset });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
```

### Get Single Item
```js
/**
 * Get single resource by id.
 *
 * Params: id
 * Returns: 200 JSON item or 404
 */
exports.get = async (req, res) => {
  try {
    const item = await Model.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
```

### Create Item
```js
/**
 * Create new resource.
 *
 * Body: resource fields
 * Returns: 201 JSON created item
 */
exports.create = async (req, res) => {
  try {
    const item = await Model.create(req.body);
    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
```

### Update Item
```js
/**
 * Update resource by id.
 *
 * Params: id
 * Body: fields to update
 * Returns: 200 JSON updated item or 404
 */
exports.update = async (req, res) => {
  try {
    const item = await Model.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    await item.update(req.body);
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
```

### Delete Item
```js
/**
 * Delete resource by id.
 *
 * Params: id
 * Returns: 200 JSON message or 404
 */
exports.remove = async (req, res) => {
  try {
    const item = await Model.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    await item.destroy();
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
```

## Relation/Association Templates

### Add Association
```js
/**
 * Add related item (e.g. comment, like).
 * 
 * Params: parentId
 * Body: related item data
 * Returns: 201 JSON created relation
 */
exports.addRelation = async (req, res) => {
  try {
    const parent = await Parent.findByPk(req.params.parentId);
    if (!parent) return res.status(404).json({ message: 'Parent not found' });
    const relation = await Relation.create({
      parentId: parent.id,
      userId: req.user.id,
      ...req.body
    });
    return res.status(201).json(relation);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
```

### Toggle Association
```js
/**
 * Toggle relation (e.g. like, follow).
 *
 * Params: itemId
 * Returns: 200 JSON { status: boolean }
 */
exports.toggle = async (req, res) => {
  try {
    const existing = await Relation.findOne({
      where: { itemId: req.params.itemId, userId: req.user.id }
    });
    if (existing) {
      await existing.destroy();
      return res.json({ status: false });
    }
    await Relation.create({
      itemId: req.params.itemId,
      userId: req.user.id
    });
    return res.json({ status: true });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
```

## Settings Templates

### Update Setting
```js
/**
 * Update user setting.
 *
 * Body: { setting: value }
 * Returns: 200 JSON updated value
 */
exports.updateSetting = async (req, res) => {
  try {
    const user = req.user;
    const { setting } = req.body;
    user.settings = { ...(user.settings || {}), ...req.body };
    await user.save();
    return res.json({ setting: user.settings[setting] });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
```

## File Response Templates

### Download File
```js
/**
 * Download resource as file.
 *
 * Params: type
 * Returns: file download
 */
exports.download = async (req, res) => {
  try {
    const data = await getData(req.params.type);
    res.setHeader('Content-Disposition', `attachment; filename="${type}.json"`);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
```

## Service Templates

### Fetch & Process
```js
/**
 * Fetch external data and process.
 *
 * Params: source configuration
 * Returns: Array of processed items
 */
async function fetchAndProcess(source) {
  try {
    const data = await externalFetch(source.url);
    const results = [];
    for (const item of data) {
      const processed = await processItem(item);
      if (processed) results.push(processed);
    }
    return results;
  } catch (err) {
    console.error('Process error:', err.message);
    return [];
  }
}
```

## Model Association Templates

### Basic Model
```js
/**
 * Model definition with common fields.
 */
module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('Model', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: DataTypes.TEXT,
    metadata: DataTypes.JSON,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  });

  Model.associate = (models) => {
    Model.belongsTo(models.User, { as: 'author' });
    Model.hasMany(models.Comment);
  };

  return Model;
};
```

## Middleware Templates

### Auth Middleware
```js
/**
 * Verify JWT and attach user.
 */
module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

### Validation Middleware
```js
/**
 * Validate request data.
 */
const validate = (rules) => {
  return async (req, res, next) => {
    await Promise.all(rules.map(rule => rule.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};
```