# 使用Python 3.9作为基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制requirements.txt文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目代码
COPY . .

# 创建日志目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 5000

# 设置环境变量
ENV HOST=0.0.0.0
ENV PORT=5000
ENV DEBUG=False

# 启动应用
CMD ["python", "main.py"]