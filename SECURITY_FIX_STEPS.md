# 修复敏感信息泄露问题

## 步骤 1: 撤销 commit

git reset --soft HEAD~1

## 步骤 2: 更新 .gitignore，忽略敏感配置文件

echo "" >> .gitignore
echo "# 环境变量和敏感配置" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo "apps/backend/lession/config.yaml" >> .gitignore

## 步骤 3: 移除敏感信息

# 从 git 暂存区移除 config.yaml

git rm --cached apps/backend/lession/config.yaml

## 步骤 4: 创建配置文件模板

# 将 config.yaml 重命名为 config.yaml.example

cp apps/backend/lession/config.yaml apps/backend/lession/config.yaml.example

# 然后编辑 config.yaml.example，将所有 API 密钥替换为占位符

# 例如: api_key: 'your_api_key_here'

## 步骤 5: 修改代码文件，移除硬编码的密钥

# 需要修改的文件：

# - apps/backend/lession/src/modules/2.1.对接聊天模型/langchain-chat-model.provider.ts

# - apps/backend/lession/src/modules/2.3.嵌入模型embeddings/embeddings/huggingface-embedding.ts

## 步骤 6: 重新提交

git add .
git commit -m "chore: 移除硬编码的敏感信息，使用配置文件管理"
git push origin main
