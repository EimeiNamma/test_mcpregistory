#!/usr/bin/env node
/**
 * seed.json を mcp-registry.json に統合するスクリプト
 * 
 * seed.json に定義されたサーバーを mcp-registry.json の servers 配列に追加します。
 * packages プロパティを server オブジェクトに含めます。
 * 
 * 使用方法:
 *   node test_mcpregistory/merge-seed-to-registry.js
 */

const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, '..', 'seed.json');
const REGISTRY_FILE = path.join(__dirname, 'mcp-registry.json');

/**
 * seed.json の単一エントリを registry 形式に変換
 * @param {Object} seedEntry - seed.json のサーバーエントリ
 * @returns {Object} registry 形式のエントリ
 */
function convertSeedToRegistry(seedEntry) {
  const { packages, ...serverWithoutPackages } = seedEntry;
  
  const registryEntry = {
    server: {
      ...serverWithoutPackages,
      packages: packages
    },
    _meta: {
      'io.modelcontextprotocol.registry/official': {
        status: 'active',
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLatest: true
      }
    }
  };
  
  return registryEntry;
}

/**
 * メイン処理
 */
function main() {
  console.log('seed.json を mcp-registry.json に統合中...\n');
  
  try {
    // 1. seed.json と mcp-registry.json を読み込み
    const seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
    
    console.log(`📄 seed.json から ${seedData.length} 個のサーバーを読み込み`);
    console.log(`📦 現在の mcp-registry.json: ${registry.servers.length} 個のサーバー\n`);
    
    // 2. seed.json の各エントリを registry 形式に変換して追加
    let addedCount = 0;
    let duplicateCount = 0;
    
    for (const seedEntry of seedData) {
      const serverName = seedEntry.name;
      
      // 既に存在するか確認
      const exists = registry.servers.some(entry => entry.server.name === serverName);
      
      if (exists) {
        console.log(`⚠️  スキップ: ${serverName} (既に登録済み)`);
        duplicateCount++;
      } else {
        const registryEntry = convertSeedToRegistry(seedEntry);
        registry.servers.push(registryEntry);
        console.log(`✓ 追加: ${serverName} (v${seedEntry.version})`);
        addedCount++;
      }
    }
    
    // 3. metadata のカウントを更新
    registry.metadata.count = registry.servers.length;
    
    // 4. 更新した mcp-registry.json を保存
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
    
    console.log(`\n✅ 完了:`);
    console.log(`   追加: ${addedCount} 個`);
    console.log(`   重複: ${duplicateCount} 個`);
    console.log(`   合計: ${registry.servers.length} 個のサーバーが登録されました`);
    
  } catch (error) {
    console.error(`❌ エラーが発生しました:`, error.message);
    process.exit(1);
  }
}

// スクリプト実行
main();
